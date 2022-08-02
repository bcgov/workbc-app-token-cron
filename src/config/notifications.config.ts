import axios, { AxiosInstance } from "axios"

const notificationsBaseUrl = process.env.NOTIFICATIONS_API_URL || ""

export const notificationsApi: AxiosInstance = axios.create({
    baseURL: notificationsBaseUrl
})

export default notificationsApi
