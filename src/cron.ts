import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import helmet from "helmet"
import cron from "node-cron"
import { QueryResult } from "pg"
import db from "./config/db.config"
import { notificationsApi } from "./config/notifications.config"

const originURL = process.env.ORIGIN_URL || process.env.OPENSHIFT_NODEJS_ORIGIN_URL || "https://localhost:8000"

const corsOptions = {
    origin: originURL,
    credentials: true,
    optionsSuccessStatus: 200
}

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(helmet())
console.log(`===== SERVER RUNNING ON PORT ${originURL} =====`)

cron.schedule("0 0 1 * *", async () => {
    console.log("===== START TOKEN CLEANUP CRON JOB =====")
    try {
        let numTokensDeleted = 0
        await db
            .query(
                `
            SELECT t.token_id, t.user_id, t.token, t.platform
            FROM  tokens t
            `,
                []
            )
            .then(async (tokens: QueryResult) => {
                // eslint-disable-next-line no-restricted-syntax
                for (const row of tokens.rows) {
                    try {
                        // Send dry run message to notifications api to get the tokens status
                        // eslint-disable-next-line no-await-in-loop
                        await notificationsApi
                            .post(
                                "Messaging/Send",
                                {
                                    title: "Test Message",
                                    content: "Test Message",
                                    token: row.token,
                                    platform: row.platform,
                                    dryRun: true // be careful to keep this set to true otherwise users will get spammed
                                },
                                {
                                    auth: {
                                        username: process.env.NOTIFICATIONS_API_USER || "",
                                        password: process.env.NOTIFICATIONS_API_PASS || ""
                                    }
                                }
                            )
                            .then(() => {
                                // Dry run message successfully sent; token is valid
                            })
                    } catch (e: any) {
                        if (e.response?.status === 400 || e.response?.status === 404) {
                            // INVALID_ARGUMENT or UNREGISTERED => safe to delete (see https://firebase.google.com/docs/cloud-messaging/manage-tokens)
                            console.log(`DELETING TOKEN: ${row.token}`)
                            // eslint-disable-next-line no-await-in-loop
                            await db
                                .query(`DELETE FROM tokens WHERE token_id = $1`, [row.token_id])
                                // eslint-disable-next-line @typescript-eslint/no-loop-func, no-loop-func
                                .then(() => {
                                    numTokensDeleted += 1
                                })
                        }
                    }
                }
            })
            .then(() => {
                console.log(`===== END TOKEN CLEANUP. # OF TOKENS DELETED: ${numTokensDeleted}  =====`)
            })
    } catch (e: any) {
        console.log(e.message)
    }
})
