import { QueryResult } from "pg"

const express = require("express")
const cookieParser = require("cookie-parser")
const helmet = require("helmet")
const cors = require("cors")
const cron = require("node-cron")
const db = require("./config/db.config")

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
console.log("===== CRON SERVICE STARTED =====")

cron.schedule("10 * * * * *", async () => {
    console.log("===== START TOKEN CLEANUP =====")

    try {
        await db.query(
            `
            SELECT t.token_id, t.user_id, t.token, t.platform
            FROM  tokens t
            `,
            []
        )
            .then(async (tokens: QueryResult) => {
                console.log(tokens.rows)
            })
    } catch (e: any) {
        console.log(e.message)
    }

    console.log("===== END TOKEN CLEANUP =====")
})
