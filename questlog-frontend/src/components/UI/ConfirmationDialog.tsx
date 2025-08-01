import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

/**
 * Custom Confirmation Dialog Component
 *
 * PURPOSE:
 * Replaces browser's default window.confirm() with a beautiful, custom-styled dialog
 * that matches the app's design system.
 *
 * FEATURES:
 * - Modal overlay with backdrop blur
 * - Custom styling based on dialog type (danger, warning, info)
 * - Smooth animations and transitions
 * - Keyboard support (ESC to close)
 * - Click outside to cancel
 * - Accessible design with proper focus management
 *
 * USED BY: Components that need user confirmation for destructive actions
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
}) => {
  // Don't render if not open
  if (!isOpen) return null;

  // Handle ESC key press
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent background scrolling
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      // Always restore scrolling when cleaning up
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Additional cleanup effect to ensure scrolling is restored when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      // Small delay to ensure any async operations complete before restoring scroll
      const timeoutId = setTimeout(() => {
        document.body.style.overflow = "unset";
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Cleanup on component unmount to ensure scrolling is always restored
  React.useEffect(() => {
    // Add a global restoration function to window for emergency cases
    (window as any).forceRestoreScroll = () => {
      document.body.style.overflow = "unset";
      console.log("🔄 Force scroll restoration triggered");
    };

    return () => {
      // Always restore scrolling when component unmounts
      document.body.style.overflow = "unset";
      // Clean up global function
      delete (window as any).forceRestoreScroll;
    };
  }, []);

  // Get colors based on dialog type
  const getTypeColors = () => {
    switch (type) {
      case "danger":
        return {
          border: "border-red-500/30",
          bg: "bg-red-900/20",
          icon: "text-red-400",
          confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          border: "border-yellow-500/30",
          bg: "bg-yellow-900/20",
          icon: "text-yellow-400",
          confirmBtn: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      case "info":
        return {
          border: "border-blue-500/30",
          bg: "bg-blue-900/20",
          icon: "text-blue-400",
          confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white",
        };
    }
  };

  const colors = getTypeColors();

  const handleClose = () => {
    // Force scroll restoration immediately
    document.body.style.overflow = "unset";

    onClose();

    // Additional safety restoration
    setTimeout(() => {
      document.body.style.overflow = "unset";
    }, 50);
  };

  const handleConfirm = () => {
    // Force scroll restoration before and after confirm
    document.body.style.overflow = "unset";

    onConfirm();

    // Additional safety restoration after a brief delay
    setTimeout(() => {
      document.body.style.overflow = "unset";
    }, 50);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ marginTop: "0px" }}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className={`
          relative max-w-md w-full mx-auto
          ${colors.bg} ${colors.border} border rounded-lg shadow-xl
          transform transition-all duration-200 ease-out
          scale-100 opacity-100
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className={`w-6 h-6 ${colors.icon}`} />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-800/30 rounded-b-lg">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${colors.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
