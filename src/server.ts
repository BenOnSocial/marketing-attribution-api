import 'dotenv/config';
import cors from '@fastify/cors';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';
import Fastify from 'fastify'
import { z } from 'zod';

const app = Fastify({
  logger: true
})
app.register(cors, { origin: '*' })

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

const leadSchema = z.object({
    email: z.email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    company: z.string().optional(),
    jobTitle: z.string().optional(),
    employees: z.number().int().positive().optional(),
    source: z.string(),
    campaign: z.string().optional(),
});

function calculateLeadScore(data: z.infer<typeof leadSchema>) {
    let score = 0;

    // Fit (Demographic/Firmographic) score
    if (data.jobTitle && /vp|director|chief|head/i.test(data.jobTitle)) score += 30;
    if (data.employees && data.employees > 500) score += 20;
    if (data.employees && data.employees > 5000) score += 10;

    // Engagement (Behavioral) scoring
    if (data.source.toLowerCase() === 'linkedin') score += 15;
    if (data.source.toLowerCase() === 'organic') score += 5;

    return {
        totalScore: score,
        isMql: score >= 40  // Marketing Qualified Lead threshold
    };
}

app.post('/leads', async (request, reply) => {
    try {
        const parsedData = leadSchema.parse(request.body);
        const scoringResult = calculateLeadScore(parsedData);
        const newLead = await prisma.lead.create({
            data: {
                email: parsedData.email,
                firstName: parsedData.firstName,
                lastName: parsedData.lastName,
                company: parsedData.company ?? null,
                jobTitle: parsedData.jobTitle ?? null,
                employees: parsedData.employees ?? null,

                attribution: {
                    create: {
                        source: parsedData.source,
                        campaign: parsedData.campaign ?? null,
                    },
                },
                score: {
                    create: {
                        totalScore: scoringResult.totalScore,
                        isMql: scoringResult.isMql
                    }
                }
            },
            include: { attribution: true, score: true }
        });


        const allLeads = await prisma.lead.findMany();
        console.log("query all leads:", JSON.stringify(allLeads, null, 2));

        return reply.code(201).send(newLead);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return reply.code(400).send({ error: 'Invalid input', details: error.issues });
        }

        app.log.error(error);
        return reply.code(500).send({ error: 'Internal Server Error' });
    }
});

async function main() {
    await app.listen({ port: 3000 });
    console.log('🚀 Lead Attribution API running at http://localhost:3000');
}

main()
    .then(async() => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

export { prisma };
