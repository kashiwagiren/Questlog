// React hooks for state management and context creation
import React, { useState, useEffect, createContext, useContext } from "react";
// Lucide React icons for notification types and actions
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

// TypeScript type definitions for notification system
type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  id: string; // Unique identifier for each notification
  type: NotificationType; // Visual style and icon type
  title: string; // Bold header text
  message: string; // Main notification content
  duration?: number; // Auto-dismiss time in milliseconds (0 = no auto-dismiss)
}

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, "id">) => void; // Function to show new notification
  removeNotification: (id: string) => void; // Function to dismiss notification
}

/**
 * Notification Context for Global State Management
 *
 * PURPOSE:
 * Provides a way for any component in the app to show notifications
 * without prop drilling or complex state management.
 *
 * USED BY: Any component that needs to show user feedback messages
 */
const NotificationContext = createContext<NotificationContextType | null>(null);

/**
 * Hook to Access Notification System
 *
 * PURPOSE:
 * Provides a simple way for components to access the notification functions.
 * Throws error if used outside of NotificationProvider (prevents runtime bugs).
 *
 * CALLED BY: Components that need to show notifications (QuestBoard, AdminPanel, etc.)
 *
 * USAGE EXAMPLE:
 * const { addNotification } = useNotification();
 * addNotification({ type: "success", title: "Quest Completed!", message: "Badge minted successfully" });
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode; // App components that can use notifications
}

/**
 * Notification Provider Component
 *
 * PURPOSE:
 * Manages global notification state and provides context to child components.
 * Handles automatic dismissal, notification queuing, and state management.
 *
 * FEATURES:
 * - Auto-dismiss with configurable duration
 * - Multiple notifications stacked vertically
 * - Manual dismiss with X button
 * - Unique ID generation for each notification
 * - TypeScript safety for notification types
 *
 * CALLED BY: main.tsx wraps entire App in this provider
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  // Array of currently active notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Add New Notification Function
   *
   * PURPOSE:
   * Creates and displays a new notification with auto-dismiss timer.
   * Generates unique ID and adds to notification queue.
   *
   * CALLED BY: Components via useNotification hook
   *
   * @param notification - Notification data without ID (ID generated automatically)
   */
  const addNotification = (notification: Omit<Notification, "id">) => {
    // Generate unique ID using timestamp + random string
    const id = `notification-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create full notification object with default duration
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // Default 5 seconds auto-dismiss
    };

    // Add to notification array (newest notifications appear at top)
    setNotifications((prev) => [...prev, newNotification]);

    // Set up auto-dismiss timer if duration is specified
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id); // Remove notification after specified duration
      }, newNotification.duration);
    }
  };

  /**
   * Remove Notification Function
   *
   * PURPOSE:
   * Removes a notification from the active list by filtering out the matching ID.
   *
   * CALLED BY:
   * - Auto-dismiss timer (setTimeout above)
   * - Manual dismiss when user clicks X button
   * - Component cleanup
   *
   * @param id - Unique identifier of notification to remove
   */
  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  return (
    // Provide notification functions to all child components
    <NotificationContext.Provider
      value={{ addNotification, removeNotification }}
    >
      {children}
      {/* Render notification container as overlay */}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  notifications: Notification[]; // Array of active notifications
  removeNotification: (id: string) => void; // Function to dismiss notifications
}

/**
 * Notification Container Component
 *
 * PURPOSE:
 * Renders the actual notification UI elements in a fixed position overlay.
 * Handles positioning, stacking, and responsive behavior.
 *
 * POSITIONING:
 * - Fixed position in top-right corner
 * - High z-index (50) to appear above all other content
 * - Responsive max-width for mobile compatibility
 * - Vertical stacking with spacing
 *
 * CALLED BY: NotificationProvider automatically
 */
const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  removeNotification,
}) => {
  // Don't render anything if no notifications
  if (notifications.length === 0) return null;

  return (
    // Fixed overlay container for notifications
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full sm:w-auto px-4 sm:px-0">
      {/* Render each notification as individual item */}
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onRemove: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRemove,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case "success":
        return "border-green-500/30 bg-green-900/20 backdrop-blur-sm";
      case "error":
        return "border-red-500/30 bg-red-900/20 backdrop-blur-sm";
      case "warning":
        return "border-yellow-500/30 bg-yellow-900/20 backdrop-blur-sm";
      case "info":
        return "border-blue-500/30 bg-blue-900/20 backdrop-blur-sm";
    }
  };

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(onRemove, 200); // Wait for exit animation
  };

  return (
    <div
      className={`
        transform transition-all duration-200 ease-out
        ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }
        ${getColors()}
        border rounded-lg shadow-lg p-4 w-full sm:min-w-80 sm:max-w-sm
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <h4 className="text-sm font-medium text-white mb-1 break-words">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-300 whitespace-pre-line break-words overflow-wrap-anywhere">
            {notification.message}
          </p>
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Utility Helper Functions for Common Notification Patterns
 *
 * PURPOSE:
 * These functions provide a convenient way to show notifications with
 * pre-configured styles and durations for common use cases.
 *
 * USAGE:
 * Instead of calling addNotification directly, components can use these helpers:
 *
 * const notify = {
 *   success: showSuccess(addNotification),
 *   error: showError(addNotification),
 *   warning: showWarning(addNotification),
 *   info: showInfo(addNotification),
 * };
 *
 * notify.success("Quest Completed!", "Badge minted successfully");
 * notify.error("Transaction Failed", "Please try again");
 *
 * CALLED BY: Components that import these functions (QuestBoard, AdminPanel, etc.)
 */

/**
 * Show Success Notification (Green)
 *
 * USED FOR:
 * - Quest completion success
 * - Badge minting success
 * - Data saved successfully
 * - Positive user actions
 *
 * DEFAULT DURATION: 5 seconds
 */
export const showSuccess =
  (addNotification: NotificationContextType["addNotification"]) =>
  (title: string, message: string, duration?: number) => {
    addNotification({ type: "success", title, message, duration });
  };

/**
 * Show Error Notification (Red)
 *
 * USED FOR:
 * - Transaction failures
 * - Network errors
 * - Validation errors
 * - Critical issues requiring user attention
 *
 * DEFAULT DURATION: 8 seconds (longer for important errors)
 */
export const showError =
  (addNotification: NotificationContextType["addNotification"]) =>
  (title: string, message: string, duration?: number) => {
    addNotification({
      type: "error",
      title,
      message,
      duration: duration ?? 8000, // Longer duration for errors
    });
  };

/**
 * Show Warning Notification (Yellow)
 *
 * USED FOR:
 * - Requirements not met
 * - Quest already completed
 * - Caution messages
 * - Non-critical issues
 *
 * DEFAULT DURATION: 6 seconds
 */
export const showWarning =
  (addNotification: NotificationContextType["addNotification"]) =>
  (title: string, message: string, duration?: number) => {
    addNotification({
      type: "warning",
      title,
      message,
      duration: duration ?? 6000, // Medium duration for warnings
    });
  };

/**
 * Show Info Notification (Blue)
 *
 * USED FOR:
 * - General information
 * - Process status updates
 * - Tips and guidance
 * - Non-urgent notifications
 *
 * DEFAULT DURATION: 5 seconds
 */
export const showInfo =
  (addNotification: NotificationContextType["addNotification"]) =>
  (title: string, message: string, duration?: number) => {
    addNotification({ type: "info", title, message, duration });
  };
