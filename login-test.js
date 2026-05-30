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

export const options = {
  scenarios: {
    load_20: {
      executor: "per-vu-iterations",
      vus: 20,
      iterations: 1,
      maxDuration: "5s",
      tags: { load: "20" },
    },

    load_50: {
      executor: "per-vu-iterations",
      vus: 50,
      iterations: 1,
      maxDuration: "5s",
      startTime: "8s",
      tags: { load: "50" },
    },

    load_100: {
      executor: "per-vu-iterations",
      vus: 100,
      iterations: 1,
      maxDuration: "5s",
      startTime: "16s",
      tags: { load: "100" },
    },

    load_200: {
      executor: "per-vu-iterations",
      vus: 200,
      iterations: 1,
      maxDuration: "5s",
      startTime: "24s",
      tags: { load: "200" },
    },

    load_300: {
      executor: "per-vu-iterations",
      vus: 300,
      iterations: 1,
      maxDuration: "5s",
      startTime: "32s",
      tags: { load: "300" },
    },

    load_500: {
      executor: "per-vu-iterations",
      vus: 500,
      iterations: 1,
      maxDuration: "5s",
      startTime: "40s",
      tags: { load: "500" },
    },

    load_700: {
      executor: "per-vu-iterations",
      vus: 700,
      iterations: 1,
      maxDuration: "5s",
      startTime: "48s",
      tags: { load: "700" },
    },

    load_1000: {
      executor: "per-vu-iterations",
      vus: 1000,
      iterations: 1,
      maxDuration: "5s",
      startTime: "56s",
      tags: { load: "1000" },
    },
  },

  thresholds: {
    "http_req_failed{load:20}": ["rate<0.01"],
    "http_req_failed{load:50}": ["rate<0.01"],
    "http_req_failed{load:100}": ["rate<0.01"],
    "http_req_failed{load:200}": ["rate<0.01"],
    "http_req_failed{load:300}": ["rate<0.01"],
    "http_req_failed{load:500}": ["rate<0.01"],
    "http_req_failed{load:700}": ["rate<0.01"],
    "http_req_failed{load:1000}": ["rate<0.01"],

    "http_req_duration{load:20}": ["p(95)<1500"],
    "http_req_duration{load:50}": ["p(95)<1500"],
    "http_req_duration{load:100}": ["p(95)<1500"],
    "http_req_duration{load:200}": ["p(95)<1500"],
    "http_req_duration{load:300}": ["p(95)<1500"],
    "http_req_duration{load:500}": ["p(95)<1500"],
    "http_req_duration{load:700}": ["p(95)<1500"],
    "http_req_duration{load:1000}": ["p(95)<1500"],
  },
};

export default function () {
  const res = http.post(`${BASE_URL}/auth/login`, payload, params);

  check(res, {
    "login status is 200": (r) => r.status === 200,

    "login returned success": (r) => {
      try {
        return JSON.parse(r.body).status === "success";
      } catch (e) {
        return false;
      }
    },

    "login returned token": (r) => {
      try {
        return JSON.parse(r.body).token !== undefined;
      } catch (e) {
        return false;
      }
    },

    "login finished within 1.5s": (r) =>
      r.status === 200 && r.timings.duration < 1500,
  });
}
