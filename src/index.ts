export interface Env {
    touchless: Queue;
}

type Enpoints = {
    endpoint: string;
    method: string;
    body?: any;
};

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // For multiple endpoints at array at once
        let enpoints: Enpoints[] = await request.json();
        const batch: MessageSendRequest[] = enpoints.map((value) => ({
            body: value,
        }));
        await env.touchless.sendBatch(batch);
        // For single endpoint object
        // let log = await request.json();
        // await env.touchless.send(log);
        return new Response("Success!");
    },
    async queue(
        batch: MessageBatch<Enpoints>,
        env: Env,
        ctx: ExecutionContext
    ): Promise<void> {
        for (const message of batch.messages) {
            const MAX_RETRIES = 3;
            let retryCount = 1;
            console.log("Enpoint: ", message.body.endpoint);
            while (retryCount <= MAX_RETRIES) {
                try {
                    const response = await fetch(
                        message.body.endpoint,
                        message.body.method === "POST"
                            ? {
                                  method: message.body.method,
                                  body: JSON.stringify(message.body.body),
                              }
                            : {}
                    );
                    if (response.ok) {
                        console.log("Success Yo!");
                        console.log("Result", await response.json());
                        break;
                    } else {
                        throw new Error("Something went wrong!");
                    }
                } catch (error) {
                    console.log(error);
                    console.log(`Retrying : ${retryCount}/${MAX_RETRIES}`);
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    retryCount++;
                }
            }
        }
    },
};
