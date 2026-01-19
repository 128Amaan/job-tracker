const express = require("express");
const Job = require("../models/Job");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @route   POST /api/jobs
 * @desc    Create a new job application
 * @access  Private
 */
router.post("/", protect, async (req, res) => {
  try {
    const { company, role, status, location, salary, notes } = req.body;

    if (!company || !role) {
      return res.status(400).json({ message: "Company and Role are required" });
    }

    const job = await Job.create({
      user: req.user._id,
      company,
      role,
      status,
      location,
      salary,
      notes
    });

    return res.status(201).json(job);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs for logged-in user (with filters)
 * @access  Private
 */
router.get("/", protect, async (req, res) => {
  try {
    const { status, company } = req.query;

    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (company) filter.company = { $regex: company, $options: "i" };

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/jobs/:id
 * @desc    Get one job by id (only if belongs to user)
 * @access  Private
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json(job);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job
 * @access  Private
 */
router.put("/:id", protect, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json(job);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete job
 * @access  Private
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json({ message: "Job deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
