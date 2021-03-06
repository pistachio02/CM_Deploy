import withHandler, { ResponseType } from "@libs/server/withHandler";
import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/server/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseType>
) {

    const {
        session: { user },
        body: {
            name,
            price,
            description,
        }
    } = req;

    if (req.method === "POST") {


        const { result: {
            uid,
            rtmps: {
                url,
                streamKey
            },

        } } = await (
            await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${process.env.IMAGE_ACCID}/stream/live_inputs`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.STREAM_TOKEN}`,
                    },
                    body: `{"meta": {"name":"${name}"},"recording": { "mode": "automatic", "timeoutSeconds": 10}}`
                }
            )
        ).json();

        const stream = await client.stream.create({
            data: {
                cloudflareId: uid,
                cloudflareKey: streamKey,
                cloudflareUrl: url,
                name,
                price,
                description,
                user: {
                    connect: {
                        id: user?.id,
                    },
                },
            },
        });
        res.json({
            ok: true,
            stream,
        });
    }

    if (req.method === "GET") {
        const streams = await client.stream.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
                cloudflareId: true
            }
        })

        // const streams = await client.stream.findMany({
        //     take: 5, // ????????? ?????????????????? ?????? ???, take: 5 ?????? ?????? ???????????? 5?????? ???????????? ?????????, skip:5??? ?????? ?????? ???????????? 5?????? ???????????? ???????????? ??? ?????? 5?????? ???????????? ?????????. db??? ???????????? ?????? ?????? ?????? prisma??? ???????????? ?????? ??? prisma??? ???????????? ??????????????? ?????? ???????????? ????????? ???????????? ????????????????????? ?????? ???????????? ?????? ???????????? ?????? ????????? ??????????????? ??????. ?????? ?????? ???????????? ???????????? ?????????, ?????? ??????????????? ????????????????????? ????????? ?????? ???????????? ???????????? ???????????? UI??? ????????? ?????? ??? ?????? ???????????? ???????????? ?????? ???????????? ??????????????? ????????? ??? ????????? ???????????? ????????? ?????? ????????? ?????? ????????? ????????? ?????? ????????? ?????? ?????????????????? ???????????? ???????????? ????????????. ???????????? ???????????? prisma??? ??????????????? ??? ????????? ????????????????????? ?????? db??? ???????????? ???????????? ???????????? ????????? ????????? ?????? ?????? ?????? ???????????? ????????? ??????, ??????????????? ????????????????????? ???????????????, ??????????????? ?????? ??????????????? ??? ??? ?????? ????????? ????????? ????????????, ???????????? ??? ????????? * ???????????? ?????? ???????????? ????????? skip????????? ????????? ??????. ?????? ?????? 1??????????????? ?????????????????? ???????????? ?????? 5?????????, 1*5??? ?????? 5??? ?????? skip: 5??? ?????? ?????? 5?????? ???????????? ???????????? ?????? 5?????? ???????????? ???????????? ?????? ????????? ??????????????? ????????? ???????????? ??????. ????????? 2 ?????? 2*5??? skip???, ????????? 3?????? 3*5??? skip??? ????????? ???????????? ???????????? ???????????? ???????????? ??????.
        // })

        res.json({
            ok: true,
            streams,
        });
    }
};

export default withApiSession(withHandler({
    methods: ["GET", "POST"],
    handler,
}));
