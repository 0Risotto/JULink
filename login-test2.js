import http from "k6/http";
import { check } from "k6";

const BASE_URL = "http://localhost:8080";

const payload = JSON.stringify({
  email: "ans0225343@ju.edu.jo",
  password: "password@",
});

const params = {
  headers: {
    "Content-Type": "application/json",
  },
  timeout: "2000ms",
};

const loads = [
  20,
  50,
  100,
  200,
  300,
  500,
  700,
  1000,
  2000,
  5000,
];

const scenarios = {};
const thresholds = {};

loads.forEach((load, index) => {
  scenarios[`load_${load}`] = {
    executor: "per-vu-iterations",
    vus: load,
    iterations: 1,
    maxDuration: "30s",
    startTime: `${index * 10}s`,
    tags: { load: String(load) },
  };

  thresholds[`http_req_failed{load:${load}}`] = ["rate<0.01"];
  thresholds[`http_req_duration{load:${load}}`] = ["p(95)<1500"];
});

export const options = {
  scenarios,
  thresholds,
};

export default function () {
  const res = http.post(`${BASE_URL}/auth/login`, payload, params);

  check(res, {
    "login status is 200": (r) => r.status === 200,

    "login returned success": (r) => {
      try {
        return JSON.parse(r.body).status === "success";
      } catch {
        return false;
      }
    },

    "login returned token": (r) => {
      try {
        return JSON.parse(r.body).token !== undefined;
      } catch {
        return false;
      }
    },

    "login finished within 1.5s": (r) =>
      r.status === 200 && r.timings.duration < 1500,
  });
}