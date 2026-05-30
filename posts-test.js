import http from "k6/http";
import { check } from "k6";

const BASE_URL = "http://localhost:8080";

const loginPayload = JSON.stringify({
  email: "ans0225343@ju.edu.jo",
  password: "password@",
});

const loginParams = {
  headers: {
    "Content-Type": "application/json",
  },
  timeout: "5000ms",
};

const loads = [20, 50, 100, 200, 300, 500, 700, 1000, 2000, 5000];

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
  // 1. Authenticate to get JWT token
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    loginPayload,
    loginParams,
  );

  const loginSuccess = check(loginRes, {
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
  });

  if (!loginSuccess) {
    return;
  }

  const token = JSON.parse(loginRes.body).token;
  const authParams = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    timeout: "2000ms",
  };

  // 2. Create Post
  const createPostPayload = JSON.stringify({
    description: "Load testing post from k6 performance test",
    attachments: [],
  });

  const createPostRes = http.post(
    `${BASE_URL}/posts`,
    createPostPayload,
    authParams,
  );

  const createPostSuccess = check(createPostRes, {
    "create post status is 200": (r) => r.status === 200,

    "create post returned valid postId": (r) => {
      try {
        return JSON.parse(r.body).postId !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!createPostSuccess) {
    return;
  }

  const postId = JSON.parse(createPostRes.body).postId;

  // 3. Get Created Post by ID
  const getPostRes = http.get(`${BASE_URL}/posts/${postId}`, authParams);

  check(getPostRes, {
    "get post by id status is 200": (r) => r.status === 200,

    "get post returned correct ownerUsername": (r) => {
      try {
        return JSON.parse(r.body).ownerUsername !== undefined;
      } catch {
        return false;
      }
    },
  });

  // 4. Get Feed Posts
  const getFeedRes = http.get(
    `${BASE_URL}/posts/feed?page=0&size=10`,
    authParams,
  );

  check(getFeedRes, {
    "get feed posts status is 200": (r) => r.status === 200,

    "get feed returned a valid content list": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.content);
      } catch {
        return false;
      }
    },
  });
}
