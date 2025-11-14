// CORS 헤더 설정 헬퍼 함수
export const setCorsHeaders = (response: {
  set: (header: string, value: string) => void;
}) => {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS");
  response.set("Access-Control-Allow-Headers",
    "Content-Type, Authorization");
};

