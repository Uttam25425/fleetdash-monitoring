import http from "k6/http";
import { check } from "k6";

export const options = {
    scenarios: {
        api_load_test: {
            executor: "constant-arrival-rate",
            rate: 2000,
            timeUnit: "1s",
            duration: "10s",
            preAllocatedVUs: 600,
            maxVUs: 1000,
        },
    },
    thresholds: {
        http_req_failed: ["rate<0.01"],
        http_req_duration: ["p(95)<100"],
    },
};

export default function () {
    const response = http.get("http://127.0.0.1:5000/health");

    check(response, {
        "status is 200": (res) => res.status === 200,
    });
}