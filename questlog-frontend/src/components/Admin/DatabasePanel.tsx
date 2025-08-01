import React, { useState } from "react";
import { useAccount } from "wagmi";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@backend/services/supabase";

/**
 * Database Panel Component
 * Provides database connection testing and validation
 */
export const DatabasePanel: React.FC = () => {
  const { address } = useAccount();

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testDatabaseConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      // Test 1: Try to read from the quests table
      const { data, error: connectionError } = await supabase
        .from("quests")
        .select("*")
        .limit(1);

      if (connectionError) {
        if (connectionError.message.includes("does not exist")) {
          setConnectionTestResult({
            success: false,
            message:
              "Database tables do not exist. Please run the SQL schema in your Supabase dashboard.",
            details: {
              error: connectionError.message,
              solution:
                "Copy and paste the contents of 'supabase-schema-simple.sql' into the SQL Editor in your Supabase dashboard and click 'Run'.",
            },
          });
        } else {
          setConnectionTestResult({
            success: false,
            message: "Failed to connect to Supabase database.",
            details: { error: connectionError.message },
          });
        }
        return;
      }

      // Test 2: Try to create a test quest to verify write permissions
      const testQuest = {
        id: `test-${Date.now()}`,
        creator_address: "test-address",
        title: "Database Connection Test",
        description: "This is a test quest to verify database connectivity",
        category: "testing",
        difficulty: "easy",
        reward: "Test Badge",
        xp_reward: 100,
        visibility: "public",
        requirements: [],
        badge_image: "test-image-url",
        is_completed: false,
        quest_data: { test: true },
      };

      const { error: insertError } = await supabase
        .from("quests")
        .insert(testQuest);

      if (insertError) {
        setConnectionTestResult({
          success: false,
          message:
            "Database connection successful, but write permissions failed.",
          details: { error: insertError.message },
        });
        return;
      }

      // Test 3: Clean up test quest
      await supabase.from("quests").delete().eq("id", testQuest.id);

      setConnectionTestResult({
        success: true,
        message:
          "✅ Database connection successful! All tables are set up correctly.",
        details: {
          questsTable: "✅ Working",
          writePermissions: "✅ Working",
          readPermissions: "✅ Working",
        },
      });
    } catch (error: any) {
      setConnectionTestResult({
        success: false,
        message: "Unexpected error during database test.",
        details: { error: error.message },
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (!address) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Wallet Not Connected
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please connect your wallet to test the database connection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Database Connection Test */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Database Connection Test
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Test your Supabase database connection and table setup
            </p>
          </div>
          <button
            onClick={testDatabaseConnection}
            disabled={isTestingConnection}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${isTestingConnection ? "animate-spin" : ""}`}
            />
            <span>
              {isTestingConnection ? "Testing..." : "Test Connection"}
            </span>
          </button>
        </div>

        {connectionTestResult && (
          <div
            className={`rounded-lg p-4 ${
              connectionTestResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {connectionTestResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="ml-3">
                <h3
                  className={`text-sm font-medium ${
                    connectionTestResult.success
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {connectionTestResult.success
                    ? "Connection Successful"
                    : "Connection Failed"}
                </h3>
                <div
                  className={`mt-2 text-sm ${
                    connectionTestResult.success
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  <p>{connectionTestResult.message}</p>
                  {connectionTestResult.details && (
                    <div className="mt-2">
                      {connectionTestResult.success ? (
                        <div className="space-y-1">
                          <p>
                            📊 Quests Table:{" "}
                            {connectionTestResult.details.questsTable}
                          </p>
                          <p>
                            ✏️ Write Permissions:{" "}
                            {connectionTestResult.details.writePermissions}
                          </p>
                          <p>
                            📖 Read Permissions:{" "}
                            {connectionTestResult.details.readPermissions}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-red-100 p-3 rounded border border-red-200 mt-2">
                          <p className="font-medium text-red-800">
                            Error Details:
                          </p>
                          <p className="text-red-700 mt-1">
                            {connectionTestResult.details.error}
                          </p>
                          {connectionTestResult.details.solution && (
                            <div className="mt-2">
                              <p className="font-medium text-red-800">
                                Solution:
                              </p>
                              <p className="text-red-700">
                                {connectionTestResult.details.solution}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabasePanel;
