import {Timestamp} from "firebase-admin/firestore";
import {ProjectDoc} from "../types/project";
import {ProjectRepository} from "../repositories/projectRepository";
import * as logger from "firebase-functions/logger";
import {stripUndefined} from "../utils/clean";
import {toFirestorePatch} from "../utils/patch";

// GitHub README 가져오기 (Fail-Safe)
async function fetchGitHubReadme(githubUrl: string): Promise<string | undefined> {
  try {
    // GitHub URL 파싱: https://github.com/owner/repo
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      logger.warn(`Invalid GitHub URL format: ${githubUrl}`);
      return undefined;
    }

    const [, owner, repo] = match;

    // GitHub API를 통해 README 가져오기
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          "User-Agent": "GDGoC-Website",
          "Accept": "application/vnd.github.v3.raw",
        },
      }
    );

    if (!response.ok) {
      logger.warn(`GitHub API failed for ${owner}/${repo}: ${response.status}`);
      return undefined;
    }

    const readmeContent = await response.text();
    logger.info(`Successfully fetched README for ${owner}/${repo}`);
    return readmeContent;
  } catch (error) {
    // Fail-Safe: 에러 발생 시 undefined 반환하고 경고만 로그
    logger.warn("Error fetching GitHub README (non-blocking)", error);
    return undefined;
  }
}

// 비즈니스 로직 레이어
export class ProjectService {
  private projectRepo: ProjectRepository;

  constructor() {
    this.projectRepo = new ProjectRepository();
  }

  // 프로젝트 생성
  async createProject(projectData: Omit<ProjectDoc, "id" | "createdAt" | "updatedAt">): Promise<ProjectDoc> {
    // 필수 필드 검증
    if (!projectData.title || !projectData.summary || !projectData.semester || !projectData.status) {
      throw new Error("Missing required fields: title, summary, semester, status");
    }

    // semester 형식 검증 (YYYY-1 or YYYY-2)
    const semesterRegex = /^\d{4}-[12]$/;
    if (!semesterRegex.test(projectData.semester)) {
      throw new Error("Invalid semester format. Expected: YYYY-1 or YYYY-2 (e.g., 2024-2)");
    }

    // status 검증
    if (projectData.status !== "ongoing" && projectData.status !== "completed") {
      throw new Error("Invalid status. Must be 'ongoing' or 'completed'");
    }

    // GitHub README 가져오기 (Fail-Safe)
    let readmeContent: string | undefined;
    let readmeFetchedAt: Timestamp | undefined;

    if (projectData.githubUrl) {
      readmeContent = await fetchGitHubReadme(projectData.githubUrl);
      if (readmeContent) {
        readmeFetchedAt = Timestamp.now();
      }
    }

    const newProject: Omit<ProjectDoc, "id"> = stripUndefined({
      ...projectData,
      readmeContent,
      readmeFetchedAt,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const id = await this.projectRepo.create(newProject);

    logger.info("Project created", {id, title: projectData.title});

    return {
      id,
      ...newProject,
    };
  }

  // 프로젝트 목록 조회
  async getProjects(
    limit: number = 20,
    offset: number = 0,
    filters?: {
      semester?: string;
      status?: "ongoing" | "completed";
    }
  ): Promise<{
    projects: ProjectDoc[];
    total: number;
  }> {
    const projects = await this.projectRepo.findAll(limit, offset, filters);

    return {
      projects,
      total: projects.length,
    };
  }

  // 단일 프로젝트 조회
  async getProject(projectId: string): Promise<ProjectDoc> {
    const project = await this.projectRepo.findById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  }

  // 프로젝트 업데이트
  async updateProject(
    projectId: string,
    updateData: Partial<Omit<ProjectDoc, "id" | "createdAt">>
  ): Promise<ProjectDoc> {
    // 프로젝트 존재 확인
    const existingProject = await this.projectRepo.findById(projectId);
    if (!existingProject) {
      throw new Error("Project not found");
    }

    // semester 형식 검증 (제공된 경우)
    if (updateData.semester) {
      const semesterRegex = /^\d{4}-[12]$/;
      if (!semesterRegex.test(updateData.semester)) {
        throw new Error("Invalid semester format. Expected: YYYY-1 or YYYY-2 (e.g., 2024-2)");
      }
    }

    // status 검증 (제공된 경우)
    if (updateData.status && updateData.status !== "ongoing" && updateData.status !== "completed") {
      throw new Error("Invalid status. Must be 'ongoing' or 'completed'");
    }

    const updatePayload: Partial<ProjectDoc> = {
      ...updateData,
      updatedAt: Timestamp.now(),
    };

    // GitHub URL이 변경된 경우 README 다시 가져오기
    if (updateData.githubUrl && updateData.githubUrl !== existingProject.githubUrl) {
      const readmeContent = await fetchGitHubReadme(updateData.githubUrl);
      if (readmeContent) {
        updatePayload.readmeContent = readmeContent;
        updatePayload.readmeFetchedAt = Timestamp.now();
      }
    }

    const sanitizedPayload = stripUndefined(updatePayload);
    const patchPayload = toFirestorePatch(sanitizedPayload as Record<string, unknown>);
    const updatedProject = await this.projectRepo.update(
      projectId,
      patchPayload as Partial<ProjectDoc>
    );

    logger.info("Project updated", {id: projectId});

    return updatedProject;
  }

  // 프로젝트 삭제
  async deleteProject(projectId: string): Promise<void> {
    // 프로젝트 존재 확인
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await this.projectRepo.delete(projectId);
    logger.info("Project deleted", {id: projectId});
  }

  // README 수동 갱신 (선택적 기능)
  async refreshReadme(projectId: string): Promise<ProjectDoc> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (!project.githubUrl) {
      throw new Error("Project has no GitHub URL");
    }

    const readmeContent = await fetchGitHubReadme(project.githubUrl);

    const updatePayload: Partial<ProjectDoc> = stripUndefined({
      updatedAt: Timestamp.now(),
    });

    if (readmeContent) {
      updatePayload.readmeContent = readmeContent;
      updatePayload.readmeFetchedAt = Timestamp.now();
    }

    const patchPayload = toFirestorePatch(updatePayload as Record<string, unknown>);
    const updatedProject = await this.projectRepo.update(
      projectId,
      patchPayload as Partial<ProjectDoc>
    );

    logger.info("Project README refreshed", {id: projectId});

    return updatedProject;
  }
}
