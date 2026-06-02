import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
    },

    description: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    video: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      default: "Bharatvaani Prangan",
    },

    category: {
      type: String,
      required: true,
      default: "National",
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },

    url: {
      type: String,
      default: "",
    },

    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 SAFE SLUG GENERATION (NO next, NO error)
articleSchema.pre("save", function () {
  if (!this.slug && this.title) {
    this.slug =
      this.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-") +
      "-" +
      Date.now();
  }
});

const Article =
  mongoose.models.Article || mongoose.model("Article", articleSchema);

export default Article;