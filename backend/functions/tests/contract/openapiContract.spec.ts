import swaggerJsdoc from "swagger-jsdoc";
import {openApiOptions} from "../../src/docs/openapi";

let spec: ReturnType<typeof swaggerJsdoc>;

describe("OpenAPI Contract Snapshot", () => {
  beforeAll(() => {
    spec = swaggerJsdoc(openApiOptions);
  });

  it("정상적으로 주요 스키마를 포함한다", () => {
    expect(spec.components?.schemas?.User).toBeDefined();
    expect(spec.components?.schemas?.Post).toBeDefined();
    expect(spec.components?.schemas?.Comment).toBeDefined();
    expect(spec.components?.schemas?.RecruitConfig).toBeDefined();
  });

  it("TipTapDoc 스키마가 정의되어 있어야 한다", () => {
    expect(spec.components?.schemas?.TipTapDoc).toBeDefined();
  });

  it("/users/link-member 경로가 User 스키마를 반환한다", () => {
    const path = spec.paths?.["/users/link-member"]?.post;
    expect(path).toBeDefined();
    expect(path?.responses?.["200"].content?.["application/json"].schema).toBeDefined();
  });

  it("/posts/{postId} 경로가 Post 스키마를 사용한다", () => {
    const getPost = spec.paths?.["/posts/{postId}"]?.get;
    expect(getPost?.responses?.["200"].content?.["application/json"].schema).toBeDefined();
  });

  it("Recruit API 경로가 모두 정의되어 있다", () => {
    const recruitPaths = [
      "/recruit/applications",
      "/recruit/login",
      "/recruit/me",
      "/recruit/reset-password",
      "/recruit/config",
    ];
    recruitPaths.forEach((route) => {
      expect(spec.paths?.[route]).toBeDefined();
    });
  });

  it("Recruit session은 별도 security scheme을 요구한다", () => {
    const me = spec.paths?.["/recruit/me"];
    expect(me?.get?.security).toEqual([{recruitSession: []}]);
    expect(me?.patch?.security).toEqual([{recruitSession: []}]);
  });
});
