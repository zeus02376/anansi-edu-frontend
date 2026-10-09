import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, ""),
  timeout: 10_000,
});
