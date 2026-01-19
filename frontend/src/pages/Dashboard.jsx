import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  SlidersHorizontal,
  LogOut,
  Pencil,
  Trash2,
  Calendar,
  Link as LinkIcon,
  FileText,
} from "lucide-react";

import api from "../api/axios";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";

import { toast } from "sonner";

const STATUS_OPTIONS = ["Applied", "Interview", "Offer", "Rejected"];

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("add"); // "add" | "edit"
  const [selectedJob, setSelectedJob] = useState(null);

  // Form state
  const [form, setForm] = useState({
    company: "",
    role: "",
    status: "Applied",
    dateApplied: "",
    notes: "",
    link: "",
  });

  // =========================
  // Fetch jobs
  // =========================
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await api.get("/jobs");
        setJobs(res.data);
      } catch (err) {
        console.log(err);
        toast.error("Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // =========================
  // Stats
  // =========================
  const stats = useMemo(() => {
    const total = jobs.length;
    const applied = jobs.filter((j) => j.status === "Applied").length;
    const interview = jobs.filter((j) => j.status === "Interview").length;
    const offer = jobs.filter((j) => j.status === "Offer").length;
    const rejected = jobs.filter((j) => j.status === "Rejected").length;

    return { total, applied, interview, offer, rejected };
  }, [jobs]);

  // =========================
  // Filter jobs
  // =========================
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const company = job.company || "";
      const role = job.role || "";

      const matchesSearch =
        company.toLowerCase().includes(search.toLowerCase()) ||
        role.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ? true : job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  // =========================
  // Modal helpers
  // =========================
  const openAddModal = () => {
    setMode("add");
    setSelectedJob(null);
    setForm({
      company: "",
      role: "",
      status: "Applied",
      dateApplied: "",
      notes: "",
      link: "",
    });
    setOpen(true);
  };

  const openEditModal = (job) => {
    setMode("edit");
    setSelectedJob(job);

    setForm({
      company: job.company || "",
      role: job.role || "",
      status: job.status || "Applied",
      dateApplied: job.dateApplied
        ? new Date(job.dateApplied).toISOString().slice(0, 10)
        : "",
      notes: job.notes || "",
      link: job.link || "",
    });

    setOpen(true);
  };

  // =========================
  // CRUD handlers
  // =========================
  const handleDelete = async (id) => {
    try {
      await api.delete(`/jobs/${id}`);
      setJobs((prev) => prev.filter((job) => job._id !== id));
      toast.success("Job deleted");
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete job");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.company.trim() || !form.role.trim()) {
      toast.error("Company and Role are required");
      return;
    }

    try {
      if (mode === "add") {
        const payload = {
          company: form.company.trim(),
          role: form.role.trim(),
          status: form.status,
          dateApplied: form.dateApplied ? form.dateApplied : undefined,
          notes: form.notes?.trim() || "",
          link: form.link?.trim() || "",
        };

        const res = await api.post("/jobs", payload);

        // add job instantly in UI
        setJobs((prev) => [res.data, ...prev]);

        toast.success("Job added");
        setOpen(false);
      } else {
        // edit
        const payload = {
          company: form.company.trim(),
          role: form.role.trim(),
          status: form.status,
          dateApplied: form.dateApplied ? form.dateApplied : undefined,
          notes: form.notes?.trim() || "",
          link: form.link?.trim() || "",
        };

        const res = await api.put(`/jobs/${selectedJob._id}`, payload);

        setJobs((prev) =>
          prev.map((job) => (job._id === selectedJob._id ? res.data : job))
        );

        toast.success("Job updated");
        setOpen(false);
      }
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Job Tracker
            </h1>
            <p className="text-sm text-zinc-400">Track applications like a pro</p>
          </div>

          <div className="flex items-center gap-2">
            <Button className="gap-2" onClick={openAddModal}>
              <Plus size={16} />
              Add Job
            </Button>

            <Button
              variant="outline"
              className="gap-2 border-zinc-700"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </Button>

          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Jobs" value={stats.total} />
          <StatCard title="Applied" value={stats.applied} />
          <StatCard title="Interviewing" value={stats.interview} />
          <StatCard title="Offers" value={stats.offer} />
        </div>

        {/* Search + Filters */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <Input
              className="pl-10 bg-zinc-900 border-zinc-700 focus-visible:ring-zinc-500"
              placeholder="Search by company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-zinc-700">
                <SlidersHorizontal size={16} />
                Status: {statusFilter}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
              {["All", ...STATUS_OPTIONS].map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="cursor-pointer focus:bg-zinc-800"
                >
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Jobs List */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">Your Jobs</h2>
          <p className="text-sm text-zinc-400">
            Manage your applications in one place.
          </p>

          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <EmptyState onAdd={openAddModal} />
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onEdit={() => openEditModal(job)}
                  onDelete={() => handleDelete(job._id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {mode === "add" ? "Add Job" : "Edit Job"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Company Name</label>
                <Input
                  className="bg-zinc-900 border-zinc-700 focus-visible:ring-zinc-500"
                  value={form.company}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, company: e.target.value }))
                  }
                  placeholder="Google"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Role</label>
                <Input
                  className="bg-zinc-900 border-zinc-700 focus-visible:ring-zinc-500"
                  value={form.role}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, role: e.target.value }))
                  }
                  placeholder="SDE Intern"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Status</label>
                <select
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500"
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value }))
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Date Applied</label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <Input
                    type="date"
                    className="pl-10 bg-zinc-900 border-zinc-700 focus-visible:ring-zinc-500"
                    value={form.dateApplied}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, dateApplied: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Notes</label>
              <div className="relative">
                <FileText
                  size={16}
                  className="absolute left-3 top-3 text-zinc-400"
                />
                <textarea
                  className="min-h-[90px] w-full rounded-xl border border-zinc-700 bg-zinc-900 px-10 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Applied via referral..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Link (optional)</label>
              <div className="relative">
                <LinkIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <Input
                  className="pl-10 bg-zinc-900 border-zinc-700 focus-visible:ring-zinc-500"
                  value={form.link}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, link: e.target.value }))
                  }
                  placeholder="https://company.com/job/123"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-zinc-700"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button type="submit">
                {mode === "add" ? "Add Job" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="border-zinc-800 bg-zinc-950/60 shadow-lg rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function JobCard({ job, onEdit, onDelete }) {
  const badgeColor =
    job.status === "Applied"
      ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
      : job.status === "Interview"
      ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
      : job.status === "Offer"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : "bg-red-500/15 text-red-300 border-red-500/30";

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="border-zinc-800 bg-zinc-950/60 rounded-2xl shadow-lg hover:border-zinc-700">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-zinc-400">{job.company}</p>
              <h3 className="text-lg font-semibold">{job.role}</h3>
            </div>

            <Badge
              variant="outline"
              className={`border ${badgeColor} rounded-full`}
            >
              {job.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="text-sm text-zinc-400">
          <p>
            Applied:{" "}
            <span className="text-zinc-200">
              {job.dateApplied
                ? new Date(job.dateApplied).toLocaleDateString()
                : "N/A"}
            </span>
          </p>

          {job.notes && (
            <p className="mt-2 line-clamp-2 text-zinc-400">{job.notes}</p>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl gap-2"
              onClick={onEdit}
              type="button"
            >
              <Pencil size={14} />
              Edit
            </Button>

            <Button
              size="sm"
              variant="destructive"
              className="rounded-xl gap-2"
              onClick={onDelete}
              type="button"
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <Card className="border-zinc-800 bg-zinc-950/60 rounded-2xl shadow-lg">
      <CardHeader>
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-800" />
        <div className="mt-2 h-6 w-40 animate-pulse rounded bg-zinc-800" />
      </CardHeader>
      <CardContent>
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-800" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-zinc-800" />
      </CardContent>
    </Card>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center">
      <h3 className="text-lg font-semibold">No jobs found</h3>
      <p className="mt-2 text-sm text-zinc-400">
        Try changing your filters or add a new job.
      </p>

      <div className="mt-4 flex justify-center">
        <Button className="gap-2" onClick={onAdd}>
          <Plus size={16} />
          Add your first job
        </Button>
      </div>
    </div>
  );
}
