function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this role"
      });
    }

    const userRole = req.user.role;

    // "both" role users can access any student or candidate protected route
    if (userRole === "both") {
      const isBothAllowed =
        allowedRoles.includes("student") ||
        allowedRoles.includes("candidate") ||
        allowedRoles.includes("both");
      if (isBothAllowed) return next();
    }

    let rolesToCheck = [...allowedRoles];
    // If student access is allowed, candidate access is also allowed
    if (rolesToCheck.includes("student") && !rolesToCheck.includes("candidate")) {
      rolesToCheck.push("candidate");
    }

    if (!rolesToCheck.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this role"
      });
    }
    next();
  };
}


module.exports = { authorizeRoles };
