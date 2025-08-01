// Discord OAuth2 and verification service
interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  verified: boolean;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string;
  permissions: string;
}

export class DiscordService {
  private static readonly CLIENT_ID =
    import.meta.env.VITE_DISCORD_CLIENT_ID || "1397849962733371462";
  private static readonly CLIENT_SECRET =
    import.meta.env.VITE_DISCORD_CLIENT_SECRET ||
    "_6T3AuZ_5gyAEYU1gFWno-DD2THecgKB";
  private static readonly REDIRECT_URI =
    import.meta.env.VITE_DISCORD_REDIRECT_URI || `${window.location.origin}`;
  private static readonly BOT_TOKEN =
    import.meta.env.VITE_DISCORD_BOT_TOKEN ||
    "MTM5Nzg0OTk2MjczMzM3MTQ2Mg.GEr8kk.RGkQbFWz3tmsJXFfEERGVeiVLU-JyLeapxV_pU";

  // Helper to get the correct API URL (use proxy in development)
  private static getApiUrl(endpoint: string): string {
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isDevelopment) {
      return `/api/discord${endpoint}`;
    }
    return `https://discord.com/api${endpoint}`;
  }

  // Generate Discord OAuth2 authorization URL
  static getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: "code",
      scope: "identify guilds",
      prompt: "consent",
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  static async exchangeCodeForToken(
    code: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      console.log("Attempting to exchange Discord code for token...");

      const apiUrl = this.getApiUrl("/oauth2/token");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: this.REDIRECT_URI,
        }),
      });

      console.log(`Token exchange response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Token exchange failed:", errorText);
        throw new Error(
          `Failed to exchange code for token: ${response.status} ${errorText}`
        );
      }

      const tokenData = await response.json();
      console.log("Token exchange successful");
      return tokenData;
    } catch (error) {
      console.error("Error in exchangeCodeForToken:", error);
      throw error;
    }
  }

  // Get Discord user information
  static async getUser(accessToken: string): Promise<DiscordUser> {
    try {
      console.log("Fetching Discord user information...");

      const apiUrl = this.getApiUrl("/users/@me");
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log(`User fetch response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("User fetch failed:", errorText);
        throw new Error(
          `Failed to fetch user information: ${response.status} ${errorText}`
        );
      }

      const userData = await response.json();
      console.log("User fetch successful:", {
        id: userData.id,
        username: userData.username,
      });
      return userData;
    } catch (error) {
      console.error("Error in getUser:", error);
      throw error;
    }
  }

  // Get user's Discord guilds (servers)
  static async getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
    try {
      console.log("Fetching user guilds...");

      const apiUrl = this.getApiUrl("/users/@me/guilds");
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log(`Guilds fetch response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Guilds fetch failed:", errorText);
        throw new Error(
          `Failed to fetch user guilds: ${response.status} ${errorText}`
        );
      }

      const guildsData = await response.json();
      console.log(
        "Guilds fetch successful:",
        guildsData.length,
        "guilds found"
      );
      return guildsData;
    } catch (error) {
      console.error("Error in getUserGuilds:", error);
      throw error;
    }
  }

  // Check if user is member of a specific guild using bot token
  static async checkGuildMembership(
    guildId: string,
    userId: string
  ): Promise<boolean> {
    try {
      console.log(`Checking membership for user ${userId} in guild ${guildId}`);

      const apiUrl = this.getApiUrl(`/guilds/${guildId}/members/${userId}`);
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bot ${this.BOT_TOKEN}`,
        },
      });

      console.log(`Discord API response status: ${response.status}`);

      if (response.status === 404) {
        console.log("User is not a member of the guild");
        return false;
      }

      if (response.status === 403) {
        console.error("Bot lacks permission to check guild membership");
        return false;
      }

      if (!response.ok) {
        console.error(
          `Discord API error: ${response.status} ${response.statusText}`
        );
        const errorText = await response.text();
        console.error("Error details:", errorText);
        return false;
      }

      const memberData = await response.json();
      console.log("Member found:", memberData);
      return true;
    } catch (error) {
      console.error("Error checking guild membership:", error);
      return false;
    }
  }

  // Verify Discord server membership for quest requirement
  static async verifyDiscordRequirement(
    userDiscordId: string,
    requirementConfig: any,
    userAccessToken?: string
  ): Promise<{ verified: boolean; error?: string }> {
    try {
      // Extract guild ID from serverId or invite link
      let guildId = requirementConfig.serverId;

      if (!guildId && requirementConfig.inviteLink) {
        // Try to extract guild ID from invite link
        // This is a simplified approach - in production, you'd want to resolve the invite
        const inviteCode = requirementConfig.inviteLink.split("/").pop();
        if (inviteCode) {
          // You would need to call Discord API to resolve invite to guild ID
          // For now, we'll require guild ID to be provided in config
          return {
            verified: false,
            error:
              "Server ID required for verification. Please configure the quest requirement with a Discord Server ID.",
          };
        }
      }

      if (!guildId) {
        return {
          verified: false,
          error: "No Discord Server ID provided for verification",
        };
      }

      console.log(
        `Verifying membership for user ${userDiscordId} in guild ${guildId}`
      );

      // Method 1: Try using bot token to check membership (most reliable but requires bot permissions)
      let isMember = await this.checkGuildMembership(guildId, userDiscordId);

      // Method 2: If bot method fails and we have user access token, use user's guild list
      if (!isMember && userAccessToken) {
        console.log("Bot verification failed, trying user token method...");
        try {
          const userGuilds = await this.getUserGuilds(userAccessToken);
          isMember = userGuilds.some((guild) => guild.id === guildId);
          console.log(`User guild check result: ${isMember}`);
          console.log(
            "User guilds:",
            userGuilds.map((g) => ({ id: g.id, name: g.name }))
          );
        } catch (error) {
          console.error("Failed to get user guilds:", error);
        }
      }

      if (!isMember) {
        return {
          verified: false,
          error:
            "You are not a member of the required Discord server. Please make sure you have joined the server and try again.",
        };
      }

      return {
        verified: true,
      };
    } catch (error) {
      console.error("Discord verification error:", error);
      return {
        verified: false,
        error: "Failed to verify Discord membership. Please try again later.",
      };
    }
  }

  // Store Discord connection for user
  static storeDiscordConnection(
    walletAddress: string,
    discordUser: DiscordUser,
    accessToken: string,
    refreshToken: string
  ) {
    const connectionData = {
      user: discordUser,
      accessToken,
      refreshToken,
      connectedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      `discord_connection_${walletAddress}`,
      JSON.stringify(connectionData)
    );
  }

  // Get stored Discord connection
  static getDiscordConnection(walletAddress: string): {
    user: DiscordUser;
    accessToken: string;
    refreshToken: string;
    connectedAt: string;
  } | null {
    const stored = localStorage.getItem(`discord_connection_${walletAddress}`);
    return stored ? JSON.parse(stored) : null;
  }

  // Remove Discord connection
  static removeDiscordConnection(walletAddress: string) {
    localStorage.removeItem(`discord_connection_${walletAddress}`);
  }

  // Check if user has Discord connected
  static isDiscordConnected(walletAddress: string): boolean {
    return this.getDiscordConnection(walletAddress) !== null;
  }

  // Helper function to resolve Discord invite to get server ID
  static async resolveInviteCode(
    inviteCode: string
  ): Promise<{ guild_id: string; guild_name: string } | null> {
    try {
      // Remove discord.gg/ or discord.com/invite/ from the invite code
      const cleanCode = inviteCode.replace(
        /https?:\/\/(discord\.gg\/|discord\.com\/invite\/)/,
        ""
      );

      const response = await fetch(
        this.getApiUrl(`/invites/${cleanCode}?with_counts=true`)
      );

      if (!response.ok) {
        console.error(`Failed to resolve invite: ${response.status}`);
        return null;
      }

      const inviteData = await response.json();
      return {
        guild_id: inviteData.guild?.id,
        guild_name: inviteData.guild?.name,
      };
    } catch (error) {
      console.error("Error resolving invite code:", error);
      return null;
    }
  }

  // Debug helper to show user's Discord servers
  static async debugUserGuilds(walletAddress: string): Promise<void> {
    const connection = this.getDiscordConnection(walletAddress);
    if (!connection) {
      console.log("No Discord connection found");
      return;
    }

    try {
      const guilds = await this.getUserGuilds(connection.accessToken);
      console.log("User Discord Servers:");
      guilds.forEach((guild) => {
        console.log(`- ${guild.name} (ID: ${guild.id})`);
      });
    } catch (error) {
      console.error("Failed to fetch user guilds:", error);
    }
  }
}
