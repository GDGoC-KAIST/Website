"use client";

import {FormEvent, useCallback, useEffect, useMemo, useState} from "react";
import CardDense from "@/components/ui/cards/CardDense";
import {api} from "@/lib/api";
import {normalizeUrl} from "@/lib/normalizeUrl";
import {ImageDoc, Member, Project, Seminar, User} from "@/lib/types";
import RecruitingAdminPanel from "@/app/components/admin/recruiting/RecruitingAdminPanel";
import AdminShell from "./_components/AdminShell";
import SeminarsPanel from "./_components/panels/SeminarsPanel";
import ProjectsPanel from "./_components/panels/ProjectsPanel";
import MembersPanel from "./_components/panels/MembersPanel";
import ImagesPanel from "./_components/panels/ImagesPanel";
import ApprovalsPanel from "./_components/panels/ApprovalsPanel";

type Tab =
  | "seminars"
  | "projects"
  | "members"
  | "images"
  | "approvals"
  | "recruiting";

const TAB_CONFIG: {id: Tab; label: string}[] = [
  {id: "seminars", label: "Seminars"},
  {id: "projects", label: "Projects"},
  {id: "members", label: "Members"},
  {id: "images", label: "Images"},
  {id: "approvals", label: "Approvals"},
  {id: "recruiting", label: "Recruiting"},
];

interface FeedbackState {
  type: "success" | "error";
  message: string;
}

const seminarInitial = {
  title: "",
  summary: "",
  speaker: "",
  date: "",
  semester: "",
  type: "invited",
  contentMd: "",
  coverImageId: "",
};

const projectInitial = {
  title: "",
  summary: "",
  semester: "",
  status: "ongoing",
  githubUrl: "",
  demoUrl: "",
  thumbnailUrl: "",
  techStack: "",
  teamMembers: "",
  description: "",
};

const memberInitial = {
  name: "",
  email: "",
  department: "",
  githubUsername: "",
};

const imageInitial = {
  name: "",
  description: "",
  file: null as File | null,
};

type RawImageDoc = Omit<ImageDoc, "url"> & {
  url?: string;
  downloadUrl?: string;
  downloadURL?: string;
  imageUrl?: string;
  publicUrl?: string;
  thumbnailUrl?: string;
};

export default function AdminPage() {
  const [adminId, setAdminId] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("seminars");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [images, setImages] = useState<ImageDoc[]>([]);

  const [seminarForm, setSeminarForm] = useState({...seminarInitial});
  const [projectForm, setProjectForm] = useState({...projectInitial});
  const [memberForm, setMemberForm] = useState({...memberInitial});
  const [imageForm, setImageForm] = useState(imageInitial);

  const [editingSeminar, setEditingSeminar] = useState<Seminar | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);

  const loadSeminars = useCallback(async () => {
    try {
      const data = await api.getSeminars({limit: 20});
      setSeminars(data.data);
    } catch (error) {
      console.error("Failed to load seminars", error);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const data = await api.getProjects({limit: 20});
      setProjects(data.data);
    } catch (error) {
      console.error("Failed to load projects", error);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const data = await api.getMembers({limit: 50});
      setMembers(data.data);
    } catch (error) {
      console.error("Failed to load members", error);
    }
  }, []);

  const loadImages = useCallback(async () => {
    try {
      const {data} = await api.getImages({limit: 20});
      const normalized =
        (data as RawImageDoc[] | undefined)?.map((image) => {
          const url = normalizeUrl(
            image.url ??
            image.downloadUrl ??
            image.downloadURL ??
            image.imageUrl ??
            image.publicUrl ??
            image.thumbnailUrl ??
            ""
          );
          return {...image, url} as ImageDoc;
        }) ?? [];
      setImages(normalized);
    } catch (error) {
      console.error("Failed to load images", error);
    }
  }, []);

  const loadPendingUsers = useCallback(async () => {
    if (!adminId.trim()) return;
    try {
      const data = await api.getPendingUsers(adminId.trim());
      setPendingUsers(data.data);
    } catch (error) {
      console.error("Failed to load pending users", error);
    }
  }, [adminId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadSeminars(),
      loadProjects(),
      loadMembers(),
      loadImages(),
    ]);
  }, [loadSeminars, loadProjects, loadMembers, loadImages]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (activeTab === "approvals" && adminId.trim()) {
      loadPendingUsers();
    }
  }, [activeTab, adminId, loadPendingUsers]);

  const disableAction = useMemo(() => !adminId.trim() || isSubmitting, [adminId, isSubmitting]);

  const ensureAdminId = () => {
    if (!adminId.trim()) {
      setFeedback({type: "error", message: "Admin ID is required"});
      return false;
    }
    return true;
  };

  const handleSeminarSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ensureAdminId()) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        adminId: adminId.trim(),
        title: seminarForm.title,
        summary: seminarForm.summary,
        speaker: seminarForm.speaker || undefined,
        date: seminarForm.date || undefined,
        semester: seminarForm.semester,
        type: seminarForm.type,
        contentMd: seminarForm.contentMd,
        coverImageId: seminarForm.coverImageId || undefined,
      };

      if (editingSeminar) {
        await api.updateSeminar(editingSeminar.id, payload);
        setFeedback({type: "success", message: "Seminar updated"});
      } else {
        await api.createSeminar(payload);
        setFeedback({type: "success", message: "Seminar created"});
      }

      setSeminarForm({...seminarInitial});
      setEditingSeminar(null);
      await loadSeminars();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback({type: "error", message});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ensureAdminId()) return;
    setIsSubmitting(true);
    setFeedback(null);

    const techStack = projectForm.techStack
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const teamMembers = projectForm.teamMembers
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const payload = {
        adminId: adminId.trim(),
        title: projectForm.title,
        summary: projectForm.summary,
        semester: projectForm.semester,
        status: projectForm.status,
        githubUrl: projectForm.githubUrl || undefined,
        demoUrl: projectForm.demoUrl || undefined,
        thumbnailUrl: projectForm.thumbnailUrl || undefined,
        description: projectForm.description || undefined,
        techStack,
        teamMembers,
      };

      if (editingProject) {
        await api.updateProject(editingProject.id, payload);
        setFeedback({type: "success", message: "Project updated"});
      } else {
        await api.createProject(payload);
        setFeedback({type: "success", message: "Project created"});
      }

      setProjectForm({...projectInitial});
      setEditingProject(null);
      await loadProjects();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback({type: "error", message});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        name: memberForm.name,
        email: memberForm.email,
        department: memberForm.department,
        githubUsername: memberForm.githubUsername,
      };

      if (editingMember) {
        await api.updateMember(editingMember.id, payload);
        setFeedback({type: "success", message: "Member updated"});
      } else {
        await api.createMember(payload);
        setFeedback({type: "success", message: "Member created"});
      }

      setMemberForm({...memberInitial});
      setEditingMember(null);
      await loadMembers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback({type: "error", message});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageForm.file) {
      setFeedback({type: "error", message: "Select an image file"});
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append("name", imageForm.name);
      formData.append("description", imageForm.description);
      formData.append("file", imageForm.file);
      await api.createImage(formData);
      setFeedback({type: "success", message: "Image uploaded"});
      setImageForm(imageInitial);
      await loadImages();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback({type: "error", message});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSeminar = async (seminar: Seminar) => {
    if (!ensureAdminId()) return;
    if (!confirm(`Delete seminar "${seminar.title}"?`)) return;
    try {
      await api.deleteSeminar(seminar.id, {adminId: adminId.trim()});
      setFeedback({type: "success", message: "Seminar deleted"});
      await loadSeminars();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback({type: "error", message});
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!ensureAdminId()) return;
    if (!confirm(`Delete project "${project.title}"?`)) return;
    try {
      await api.deleteProject(project.id, {adminId: adminId.trim()});
      setFeedback({type: "success", message: "Project deleted"});
      await loadProjects();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback({type: "error", message});
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (!confirm(`Delete member "${member.name}"?`)) return;
    try {
      await api.deleteMember(member.id);
      setFeedback({type: "success", message: "Member deleted"});
      await loadMembers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback({type: "error", message});
    }
  };

  const handleDeleteImage = async (image: ImageDoc) => {
    if (!confirm(`Delete image "${image.name}"?`)) return;
    try {
      await api.deleteImage(image.id);
      setFeedback({type: "success", message: "Image deleted"});
      await loadImages();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback({type: "error", message});
    }
  };

  const handleApproveUser = async (user: User) => {
    if (!ensureAdminId()) return;
    try {
      await api.approveUser(user.id, adminId.trim());
      setFeedback({type: "success", message: "User approved"});
      setPendingUsers((prev) => prev.filter((item) => item.id !== user.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback({type: "error", message});
    }
  };

  const handleRejectUser = async (user: User) => {
    if (!ensureAdminId()) return;
    try {
      await api.rejectUser(user.id, adminId.trim());
      setFeedback({type: "success", message: "User rejected"});
      setPendingUsers((prev) => prev.filter((item) => item.id !== user.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback({type: "error", message});
    }
  };

  const handleCopyImageId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setFeedback({type: "success", message: "Image ID copied"});
    } catch {
      setFeedback({type: "error", message: "Failed to copy ID"});
    }
  };

  const startEditSeminar = (seminar: Seminar) => {
    setEditingSeminar(seminar);
    setSeminarForm({
      title: seminar.title,
      summary: seminar.summary,
      speaker: seminar.speaker || "",
      date: seminar.date || "",
      semester: seminar.semester,
      type: seminar.type,
      contentMd: seminar.contentMd,
      coverImageId: seminar.coverImageId || "",
    });
  };

  const startEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      summary: project.summary,
      semester: project.semester,
      status: project.status,
      githubUrl: project.githubUrl || "",
      demoUrl: project.demoUrl || "",
      thumbnailUrl: project.thumbnailUrl || "",
      techStack: project.techStack.join(", "),
      teamMembers: project.teamMembers.join(", "),
      description: project.description || project.readmeContent || "",
    });
  };

  const startEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      email: member.email,
      department: member.department,
      githubUsername: member.githubUsername,
    });
  };

  return (
    <AdminShell
      adminId={adminId}
      onAdminIdChange={setAdminId}
      activeTab={activeTab}
      tabs={TAB_CONFIG}
      onTabChange={setActiveTab}
      feedback={feedback}
    >
      {activeTab === "seminars" && (
        <SeminarsPanel
          seminars={seminars}
          form={seminarForm}
          setForm={setSeminarForm}
          editing={editingSeminar}
          disableSubmit={disableAction}
          onSubmit={handleSeminarSubmit}
          onDelete={handleDeleteSeminar}
          onEdit={startEditSeminar}
          onCancelEdit={() => {
            setEditingSeminar(null);
            setSeminarForm({...seminarInitial});
          }}
        />
      )}

      {activeTab === "projects" && (
        <ProjectsPanel
          projects={projects}
          form={projectForm}
          setForm={setProjectForm}
          editing={editingProject}
          disableSubmit={disableAction}
          onSubmit={handleProjectSubmit}
          onDelete={handleDeleteProject}
          onEdit={startEditProject}
          onCancelEdit={() => {
            setEditingProject(null);
            setProjectForm({...projectInitial});
          }}
        />
      )}

      {activeTab === "members" && (
        <MembersPanel
          members={members}
          form={memberForm}
          setForm={setMemberForm}
          editing={editingMember}
          disableSubmit={isSubmitting}
          onSubmit={handleMemberSubmit}
          onDelete={handleDeleteMember}
          onEdit={startEditMember}
          onCancelEdit={() => {
            setEditingMember(null);
            setMemberForm({...memberInitial});
          }}
        />
      )}

      {activeTab === "images" && (
        <ImagesPanel
          images={images}
          form={imageForm}
          setForm={setImageForm}
          disableSubmit={isSubmitting}
          onSubmit={handleImageSubmit}
          onDelete={handleDeleteImage}
          onCopyId={handleCopyImageId}
        />
      )}

      {activeTab === "approvals" &&
        (adminId.trim() ? (
          <ApprovalsPanel
            pendingUsers={pendingUsers}
            disableAction={disableAction}
            onApprove={handleApproveUser}
            onReject={handleRejectUser}
          />
        ) : (
          <CardDense pad="lg" className="space-y-3">
            <p className="text-lg font-semibold">Pending Approvals</p>
            <p className="text-sm text-gray-600">
              Enter an admin ID above to review pending users.
            </p>
          </CardDense>
        ))}

      {activeTab === "recruiting" && (
        <CardDense pad="lg">
          <RecruitingAdminPanel adminId={adminId.trim()} />
        </CardDense>
      )}
    </AdminShell>
  );
}
