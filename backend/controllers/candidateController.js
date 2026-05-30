const Candidate = require("../models/Candidate");
const Notice = require("../models/Notice");
const fs = require("fs");
const path = require("path");

// Helper to ensure candidate exists — auto-creates a draft if missing
async function getOrCreateCandidate(req) {
  let candidate = await Candidate.findOne({ userId: req.user._id });
  if (!candidate) {
    candidate = await Candidate.create({
      userId: req.user._id,
      fullName: req.user.name || "Unnamed Candidate",
      studentId: req.user.studentId || "",
      department: req.user.department || "",
      session: req.user.session || "",
      desiredPosition: "",
      manifesto: "",
      status: "Pending"
    });
  }
  return candidate;
}

exports.submitNomination = async (req, res) => {
  try {
    const payload = {
      userId: req.user._id,
      fullName: req.body.fullName || req.user.name,
      studentId: req.body.studentId || req.user.studentId,
      department: req.body.department || req.user.department,
      session: req.body.session || req.user.session,
      desiredPosition: req.body.desiredPosition,
      shortBio: req.body.shortBio || "",
      manifesto: req.body.manifesto,
      achievements: req.body.achievements || "",
      photoPlaceholder: req.body.photoPlaceholder || "",
      documentsPlaceholder: req.body.documentsPlaceholder || "",
      status: "Pending"
    };

    if (!payload.desiredPosition || !payload.manifesto) {
      return res.status(400).json({ success: false, message: "Desired position and manifesto are required" });
    }

    if (req.files) {
      if (req.files.photo && req.files.photo.length > 0) {
        payload.photoUrl = "/uploads/candidates/photos/" + req.files.photo[0].filename;
      }
      
      if (req.files.documents && req.files.documents.length > 0) {
        // If candidate already exists, we might want to append or replace. The prompt implies appending or replacing. Let's append to existing if we want, or just replace for simplicity.
        // I will fetch existing candidate first to append, or just replace. For nomination form, usually it replaces.
        // Wait, "Candidate can upload/update only their own files". Let's replace the array or just fetch existing.
        const existingCand = await Candidate.findOne({ userId: req.user._id });
        const existingDocs = existingCand ? existingCand.documents : [];
        
        const newDocs = req.files.documents.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          url: "/uploads/candidates/documents/" + file.filename,
          mimeType: file.mimetype,
          size: file.size
        }));
        
        payload.documents = [...existingDocs, ...newDocs];
      }
    }

    const candidate = await Candidate.findOneAndUpdate(
      { userId: req.user._id },
      payload,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, message: "Nomination submitted", candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ userId: req.user._id });
    const notices   = await Notice.find({ published: true }).sort({ createdAt: -1 }).limit(3);

    // ── Real upload/completion status ─────────────────────────────
    const hasPhoto     = !!(candidate?.avatarUrl || candidate?.photoUrl);
    const hasDocuments = !!(candidate?.documents && candidate.documents.length > 0);
    const hasManifesto = !!(candidate?.manifesto  && candidate.manifesto.trim());
    const hasSlogan    = !!(candidate?.slogan     && candidate.slogan.trim());
    const hasBio       = !!(candidate?.shortBio   && candidate.shortBio.trim()) ||
                         !!(candidate?.bio        && candidate.bio?.trim());
    const hasPosition  = !!(candidate?.desiredPosition && candidate.desiredPosition.trim());

    // Score out of 6 checkpoints → percentage
    const score = [hasPhoto, hasDocuments, hasManifesto, hasSlogan, hasBio, hasPosition]
      .filter(Boolean).length;
    const profileCompletion = candidate ? Math.round((score / 6) * 100) : 0;

    // Photo+Docs combined status string
    let photoDocStatus;
    if (hasPhoto && hasDocuments) {
      photoDocStatus = "Completed";
    } else if (hasPhoto && !hasDocuments) {
      photoDocStatus = "Documents Pending";
    } else if (!hasPhoto && hasDocuments) {
      photoDocStatus = "Photo Pending";
    } else {
      photoDocStatus = "Pending";
    }

    res.json({
      success: true,
      dashboard: {
        profileCompletion,
        nominationStatus: candidate?.status || "Not Submitted",
        chosenPosition:   candidate?.desiredPosition || "Not Selected",
        profileViews: 0,
        // Granular flags for frontend rendering
        hasBio,
        hasManifesto,
        hasSlogan,
        hasPhoto,
        hasDocuments,
        photoDocStatus,
        notices
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getProfile = async (req, res) => {
  const candidate = await Candidate.findOne({ userId: req.user._id });
  res.json({ success: true, candidate });
};

exports.updateProfile = async (req, res) => {
  try {
    const candidate = await Candidate.findOneAndUpdate(
      { userId: req.user._id },
      {
        fullName: req.user.name,
        studentId: req.user.studentId,
        department: req.user.department,
        session: req.user.session,
        shortBio: req.body.bio || req.body.shortBio,
        manifesto: req.body.manifesto,
        slogan: req.body.slogan,
        photoPlaceholder: req.body.photoPlaceholder,
        contactPlaceholder: req.body.contactPlaceholder
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, message: "Candidate profile updated", candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCampaignPreview = async (req, res) => {
  const candidate = await Candidate.findOne({ userId: req.user._id });
  res.json({ success: true, candidate });
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const candidate = await getOrCreateCandidate(req);

    // Delete old avatar if it exists
    if (candidate.avatarUrl) {
      const oldPath = path.join(__dirname, "../", candidate.avatarUrl);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (err) {
          console.error("Failed to delete old avatar:", err);
        }
      }
    }

    candidate.avatarUrl = "/uploads/candidates/photos/" + req.file.filename;
    await candidate.save();

    res.json({ success: true, message: "Profile photo updated", avatarUrl: candidate.avatarUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadGalleryPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No image files provided" });
    }

    const candidate = await getOrCreateCandidate(req);

    const newPhotos = req.files.map(file => ({
      url: "/uploads/candidates/photos/" + file.filename,
      caption: req.body.caption || ""
    }));

    candidate.galleryPhotos.push(...newPhotos);
    await candidate.save();

    res.json({ success: true, message: "Gallery photos uploaded", galleryPhotos: candidate.galleryPhotos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteGalleryPhoto = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate profile not found" });
    }

    const photoId = req.params.photoId;
    const photo = candidate.galleryPhotos.id(photoId);

    if (!photo) {
      return res.status(404).json({ success: false, message: "Photo not found in gallery" });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, "../", photo.url);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete gallery photo:", err);
      }
    }

    candidate.galleryPhotos.pull(photoId);
    await candidate.save();

    res.json({ success: true, message: "Photo deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
