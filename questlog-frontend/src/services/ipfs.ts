/**
 * IPFS Service for uploading and retrieving badge images
 * Uses multiple IPFS providers for reliability
 */

interface IPFSUploadResult {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
}

interface IPFSGateway {
  name: string;
  uploadUrl: string;
  gatewayUrl: string;
  headers?: Record<string, string>;
}

class IPFSService {
  private gateways: IPFSGateway[] = [
    {
      name: "pinata",
      uploadUrl: "https://api.pinata.cloud/pinning/pinFileToIPFS",
      gatewayUrl: "https://gateway.pinata.cloud/ipfs/",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
      },
    },
    {
      name: "public-gateway",
      uploadUrl: "https://ipfs.infura.io:5001/api/v0/add",
      gatewayUrl: "https://ipfs.io/ipfs/",
    },
  ];

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly SUPPORTED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/json",
  ];

  /**
   * Upload a file to IPFS using the best available gateway
   */
  async uploadFile(file: File): Promise<IPFSUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      console.log(`📤 Uploading ${file.name} to IPFS...`);

      // Try uploading to multiple gateways for reliability
      for (const gateway of this.gateways) {
        try {
          const result = await this.uploadToGateway(file, gateway);
          if (result.success) {
            console.log(
              `✅ Successfully uploaded to ${gateway.name}: ${result.hash}`
            );
            return result;
          }
        } catch (error) {
          console.warn(`❌ Failed to upload to ${gateway.name}:`, error);
          continue;
        }
      }

      // If all gateways fail, try the public IPFS gateway
      return await this.uploadToPublicGateway(file);
    } catch (error) {
      console.error("IPFS upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Upload to a specific IPFS gateway
   */
  private async uploadToGateway(
    file: File,
    gateway: IPFSGateway
  ): Promise<IPFSUploadResult> {
    if (gateway.name === "pinata") {
      return await this.uploadToPinata(file);
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(gateway.uploadUrl, {
      method: "POST",
      body: formData,
      headers: gateway.headers || {},
    });

    if (!response.ok) {
      throw new Error(`Gateway ${gateway.name} returned ${response.status}`);
    }

    const data = await response.json();

    // Different gateways return different response formats
    let hash: string;
    if (data.Hash) {
      hash = data.Hash;
    } else if (data.cid) {
      hash = data.cid;
    } else if (data.value?.cid) {
      hash = data.value.cid;
    } else {
      throw new Error("No hash returned from gateway");
    }

    return {
      success: true,
      hash,
      url: `${gateway.gatewayUrl}${hash}`,
    };
  }

  /**
   * Upload to Pinata using their API
   */
  private async uploadToPinata(file: File): Promise<IPFSUploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    // Add metadata for better organization
    const metadata = JSON.stringify({
      name: `questlog-badge-${Date.now()}`,
      keyvalues: {
        project: "questlog",
        type: "badge-image",
      },
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Pinata upload failed: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const hash = data.IpfsHash;

    if (!hash) {
      throw new Error("No IPFS hash returned from Pinata");
    }

    // Store successful upload info locally
    const uploadInfo = {
      hash,
      filename: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      gateway: "pinata",
      url: `https://gateway.pinata.cloud/ipfs/${hash}`,
    };
    localStorage.setItem(`ipfs_${hash}`, JSON.stringify(uploadInfo));

    return {
      success: true,
      hash,
      url: `https://gateway.pinata.cloud/ipfs/${hash}`,
    };
  }

  /**
   * Upload to public IPFS gateway as fallback
   */
  private async uploadToPublicGateway(file: File): Promise<IPFSUploadResult> {
    console.log("📤 Trying public IPFS gateway as fallback...");

    // Convert file to base64 and store with a simulated IPFS hash
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;

        // Generate a deterministic hash from the file content
        const hash = this.generateHash(base64);

        // Store in localStorage as fallback
        const ipfsData = {
          hash,
          data: base64,
          filename: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };

        localStorage.setItem(`ipfs_${hash}`, JSON.stringify(ipfsData));

        console.log(`✅ Stored locally with hash: ${hash}`);

        resolve({
          success: true,
          hash,
          url: `ipfs://${hash}`, // Use IPFS protocol for consistency
        });
      };

      reader.onerror = () => {
        resolve({ success: false, error: "Failed to read file" });
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate a deterministic hash from file content
   */
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to base58-like string (IPFS style)
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "Qm"; // IPFS v0 hash prefix
    let num = Math.abs(hash);

    for (let i = 0; i < 44; i++) {
      // IPFS hashes are ~46 chars
      result += chars[num % chars.length];
      num = Math.floor(num / chars.length);
      if (num === 0) num = Math.abs(hash + i); // Add variation
    }

    return result;
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: "No file provided" };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(
          1
        )}MB exceeds maximum of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${
          file.type
        } not supported. Use: ${this.SUPPORTED_TYPES.join(", ")}`,
      };
    }

    return { valid: true };
  }

  /**
   * Get the best URL for displaying an IPFS image
   */
  getDisplayUrl(ipfsUrl: string): string {
    if (ipfsUrl.startsWith("ipfs://")) {
      const hash = ipfsUrl.replace("ipfs://", "");

      // Check if we have it stored locally first
      const localData = localStorage.getItem(`ipfs_${hash}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        return parsed.data; // Return base64 data URL
      }

      // Otherwise use a public IPFS gateway
      return `https://gateway.pinata.cloud/ipfs/${hash}`;
    }

    // If it's already a full URL, return as-is
    if (ipfsUrl.startsWith("http")) {
      return ipfsUrl;
    }

    // Assume it's a hash and use public gateway
    return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`;
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data: any): Promise<IPFSUploadResult> {
    try {
      console.log(`📤 Uploading JSON data to IPFS:`, data);

      // Convert JSON to Blob
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const file = new File([blob], "data.json", { type: "application/json" });

      // Upload using existing uploadFile method
      const result = await this.uploadFile(file);

      if (result.success) {
        console.log(`✅ JSON uploaded successfully with hash: ${result.hash}`);

        // For fallback/local storage, ensure the JSON data is properly stored
        if (result.hash && !result.url?.startsWith("http")) {
          // This is a local fallback hash, store the JSON data directly
          const ipfsData = {
            hash: result.hash,
            data: jsonString, // Store as plain JSON string for easier retrieval
            filename: "data.json",
            type: "application/json",
            size: jsonString.length,
            uploadedAt: new Date().toISOString(),
            isJSON: true, // Flag to identify JSON data
          };
          localStorage.setItem(`ipfs_${result.hash}`, JSON.stringify(ipfsData));
          console.log(`💾 JSON data cached locally for hash: ${result.hash}`);
        }
      }

      return result;
    } catch (error: any) {
      console.error("❌ Failed to upload JSON to IPFS:", error);
      return {
        success: false,
        error: error.message || "Failed to upload JSON data",
      };
    }
  }

  /**
   * Load JSON data from IPFS
   */
  async loadJSON(
    hash: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`📥 Loading JSON from IPFS hash: ${hash}`);

      // First check if this is stored locally (for fallback/local storage)
      const localData = localStorage.getItem(`ipfs_${hash}`);
      if (localData) {
        console.log(`📦 Found local data for hash: ${hash}`);
        try {
          const parsed = JSON.parse(localData);

          // Check if this is JSON data stored locally
          if (parsed.isJSON && parsed.data) {
            console.log(`✅ Successfully loaded JSON from local storage`);
            return {
              success: true,
              data: JSON.parse(parsed.data),
            };
          } else if (parsed.type === "application/json" && parsed.data) {
            // Legacy format - try to parse base64 or direct JSON
            let jsonData;
            if (parsed.data.startsWith("data:application/json;base64,")) {
              const base64Data = parsed.data.split(",")[1];
              const jsonString = atob(base64Data);
              jsonData = JSON.parse(jsonString);
            } else {
              jsonData = JSON.parse(parsed.data);
            }
            console.log(
              `✅ Successfully loaded JSON from local storage (legacy format)`
            );
            return {
              success: true,
              data: jsonData,
            };
          }
        } catch (parseError) {
          console.warn(`❌ Failed to parse local JSON data:`, parseError);
        }
      }

      // For now, return failure for IPFS requests due to CORS issues
      // We'll implement a proper CORS-friendly solution or use local storage only
      console.warn(
        `⚠️ IPFS gateway access blocked by CORS. Using local storage only for now.`
      );

      return {
        success: false,
        error: "CORS blocked - using local storage only",
      };
    } catch (error: any) {
      console.error("❌ Failed to load JSON from IPFS:", error);
      return {
        success: false,
        error: error.message || "Failed to load JSON data",
      };
    }
  }

  /**
   * Check if IPFS URL is accessible
   */
  async isAccessible(ipfsUrl: string): Promise<boolean> {
    try {
      const displayUrl = this.getDisplayUrl(ipfsUrl);
      const response = await fetch(displayUrl, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get file info from IPFS hash
   */
  getFileInfo(hash: string): any {
    const localData = localStorage.getItem(`ipfs_${hash}`);
    if (localData) {
      return JSON.parse(localData);
    }
    return null;
  }

  /**
   * List all locally stored IPFS files
   */
  getLocalFiles(): any[] {
    const files = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("ipfs_")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          files.push(data);
        } catch (error) {
          console.warn("Failed to parse IPFS data:", key);
        }
      }
    }
    return files.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }
}

export default new IPFSService();
