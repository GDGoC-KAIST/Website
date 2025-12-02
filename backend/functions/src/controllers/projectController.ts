import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {ProjectService} from "../services/projectService";
import {AdminService} from "../services/adminService";
import {setCorsHeaders} from "../utils/cors";

const projectService = new ProjectService();
const adminService = new AdminService();

// HTTP 요청/응답 처리 레이어
const handleOptions = (response: any) => {
  setCorsHeaders(response);
  if (response.method === "OPTIONS") {
    response.status(204).send("");
    return true;
  }
  return false;
};

// 관리자 권한 확인 미들웨어
const checkAdmin = async (userId: string | undefined): Promise<void> => {
  if (!userId) {
    throw new Error("adminId is required");
  }

  const isAdmin = await adminService.isAdmin(userId);
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }
};

// 프로젝트 생성 (Admin Only)
export const createProject = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {
      adminId,
      title,
      summary,
      description,
      semester,
      status,
      githubUrl,
      demoUrl,
      thumbnailUrl,
      teamMembers,
      techStack,
    } = request.body;

    // Admin 권한 확인
    await checkAdmin(adminId);

    if (!title || !summary || !semester || !status || !teamMembers || !techStack) {
      response.status(400).json({
        error: "Missing required fields: title, summary, semester, status, teamMembers, techStack",
      });
      return;
    }

    const projectData = await projectService.createProject({
      title,
      summary,
      description,
      semester,
      status,
      githubUrl,
      demoUrl,
      thumbnailUrl,
      teamMembers,
      techStack,
    });

    response.status(201).json(projectData);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      response.status(403).json({error: error.message});
      return;
    }
    logger.error("Error creating project", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : String(error);
    logger.error("Error details", {errorMessage, errorStack});
    response.status(500).json({
      error: "Failed to create project",
      message: errorMessage,
      details: process.env.FUNCTIONS_EMULATOR ? errorStack : undefined,
    });
  }
});

// 프로젝트 목록 조회 (Public)
export const getProjects = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const limit = parseInt(request.query.limit as string) || 20;
    const offset = parseInt(request.query.offset as string) || 0;
    const semester = request.query.semester as string | undefined;
    const status = request.query.status as "ongoing" | "completed" | undefined;

    // status 검증 (제공된 경우)
    if (status && status !== "ongoing" && status !== "completed") {
      response.status(400).json({error: "Invalid status. Must be 'ongoing' or 'completed'"});
      return;
    }

    const result = await projectService.getProjects(limit, offset, {semester, status});

    response.status(200).json(result);
  } catch (error) {
    logger.error("Error getting projects", error);
    response.status(500).json({error: "Failed to get projects"});
  }
});

// 단일 프로젝트 조회 (Public)
export const getProject = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "GET") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const projectId = request.path.split("/").pop();

    if (!projectId) {
      response.status(400).json({error: "Project ID is required"});
      return;
    }

    const projectData = await projectService.getProject(projectId);

    response.status(200).json(projectData);
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      response.status(404).json({error: "Project not found"});
      return;
    }
    logger.error("Error getting project", error);
    response.status(500).json({error: "Failed to get project"});
  }
});

// 프로젝트 업데이트 (Admin Only)
export const updateProject = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "PUT") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const projectId = request.path.split("/").pop();

    if (!projectId) {
      response.status(400).json({error: "Project ID is required"});
      return;
    }

    const {
      adminId,
      title,
      summary,
      description,
      semester,
      status,
      githubUrl,
      demoUrl,
      thumbnailUrl,
      teamMembers,
      techStack,
    } = request.body;

    // Admin 권한 확인
    await checkAdmin(adminId);

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (description !== undefined) updateData.description = description;
    if (semester !== undefined) updateData.semester = semester;
    if (status !== undefined) updateData.status = status;
    if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
    if (demoUrl !== undefined) updateData.demoUrl = demoUrl;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (teamMembers !== undefined) updateData.teamMembers = teamMembers;
    if (techStack !== undefined) updateData.techStack = techStack;

    const updatedProject = await projectService.updateProject(projectId, updateData);

    response.status(200).json(updatedProject);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      response.status(403).json({error: error.message});
      return;
    }
    if (error instanceof Error && error.message === "Project not found") {
      response.status(404).json({error: "Project not found"});
      return;
    }
    logger.error("Error updating project", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    response.status(500).json({
      error: "Failed to update project",
      message: errorMessage,
    });
  }
});

// 프로젝트 삭제 (Admin Only)
export const deleteProject = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "DELETE") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const projectId = request.path.split("/").pop();

    if (!projectId) {
      response.status(400).json({error: "Project ID is required"});
      return;
    }

    const {adminId} = request.body;

    // Admin 권한 확인
    await checkAdmin(adminId);

    await projectService.deleteProject(projectId);

    response.status(200).json({
      message: "Project deleted successfully",
      id: projectId,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      response.status(403).json({error: error.message});
      return;
    }
    if (error instanceof Error && error.message === "Project not found") {
      response.status(404).json({error: "Project not found"});
      return;
    }
    logger.error("Error deleting project", error);
    response.status(500).json({error: "Failed to delete project"});
  }
});

// README 수동 갱신 (Admin Only, 선택적 기능)
export const refreshProjectReadme = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (handleOptions(response)) return;

  if (request.method !== "POST") {
    response.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const projectId = request.path.split("/").pop();

    if (!projectId) {
      response.status(400).json({error: "Project ID is required"});
      return;
    }

    const {adminId} = request.body;

    // Admin 권한 확인
    await checkAdmin(adminId);

    const updatedProject = await projectService.refreshReadme(projectId);

    response.status(200).json({
      message: "README refreshed successfully",
      project: updatedProject,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      response.status(403).json({error: error.message});
      return;
    }
    if (error instanceof Error && error.message === "Project not found") {
      response.status(404).json({error: "Project not found"});
      return;
    }
    logger.error("Error refreshing README", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    response.status(500).json({
      error: "Failed to refresh README",
      message: errorMessage,
    });
  }
});
