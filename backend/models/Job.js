const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["Applied", "Interview", "Offer", "Rejected"],
      default: "Applied"
    },

    location: { type: String, trim: true },
    salary: { type: String, trim: true },

    appliedDate: { type: Date, default: Date.now },

    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
