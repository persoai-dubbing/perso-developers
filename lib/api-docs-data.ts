import type {
  ApiEndpointProps,
  TocItem,
} from "@/components/portal/api-endpoint";

// ---------------------------------------------------------------------------
// Global API Configuration
// ---------------------------------------------------------------------------
export const apiDocsConfig = {
  apiBaseUrl: "https://api.perso.ai",
  storageBaseUrl: "https://portal-media.perso.ai",
  authHeader: "XP-API-KEY",
  authDescription:
    "All API requests require the XP-API-KEY header. Generate your API key from the API Keys page.",
  keyFormat: "pk_live_xxxxxxxxxxxxxxxxxxxx",
};

export interface FlowStep {
  step: number;
  title: string;
  description: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path?: string;
  auth?: "XP-API-KEY" | "None";
  headers?: Record<string, string>;
  note?: string;
  codeExample?: string;
}

export interface ApiGuide {
  id: string;
  title: string;
  description: string;
  steps: FlowStep[];
}

export interface ApiCategory {
  slug: string;
  title: string;
  description: string;
  guides?: ApiGuide[];
  endpoints: ApiEndpointProps[];
}

export function deriveTocItems(endpoints: ApiEndpointProps[]): TocItem[] {
  return endpoints.map(({ id, method, title, path }) => ({
    id,
    method,
    title,
    path,
  }));
}

// ---------------------------------------------------------------------------
// Space API
// ---------------------------------------------------------------------------
export const spaceCategory: ApiCategory = {
  slug: "space",
  title: "Space API",
  description: "Retrieve space banner information.",
  endpoints: [
    {
      id: "list-spaces",
      method: "GET",
      path: "/portal/api/v1/spaces",
      title: "List Space Banners",
      description:
        "Retrieve the list of space banners for all spaces the authenticated user belongs to.",
      response: {
        statusCode: 200,
        example: `{
  "result": [
    {
      "spaceSeq": 1,
      "spaceName": "My Workspace",
      "planName": "Pro",
      "tier": "team",
      "logo": "https://...",
      "memberCount": 5,
      "seat": 10,
      "isDefaultSpaceOwned": true,
      "memberRole": "space_owner",
      "useVideoTranslatorEdit": true,
      "useStudioEdit": false,
      "serviceType": "video_translator",
      "originSpaceSeq": 1
    }
  ]
}`,
      },
      errors: [
        {
          code: "PT0026",
          status: 404,
          description: "Space subscription info not found",
        },
      ],
    },
    {
      id: "get-space",
      method: "GET",
      path: "/portal/api/v1/spaces/{spaceSeq}",
      title: "Get Space Banner",
      description: "Retrieve the banner information for a specific space.",
      pathParams: [
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "spaceSeq": 1,
    "spaceName": "My Workspace",
    "planName": "Pro",
    "tier": "team",
    "logo": "https://...",
    "memberCount": 5,
    "seat": 10,
    "isDefaultSpaceOwned": true,
    "memberRole": "space_owner",
    "useVideoTranslatorEdit": true,
    "useStudioEdit": false,
    "serviceType": "video_translator",
    "originSpaceSeq": 1
  }
}`,
      },
      errors: [
        {
          code: "PT0026",
          status: 404,
          description: "Space subscription info not found",
        },
        {
          code: "PT0027",
          status: 401,
          description: "Not an approved member",
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// File API
// ---------------------------------------------------------------------------
export const fileCategory: ApiCategory = {
  slug: "file",
  title: "Media API",
  description:
    "Upload video and audio files, validate media, manage external media imports, and download project output files.",
  guides: [
    {
      id: "direct-upload-flow",
      title: "Direct File Upload (Video / Audio)",
      description:
        "Uploading a file requires a multi-step process: obtain a temporary SAS token, upload the binary to Azure Blob Storage, then register the uploaded file with the server.",
      steps: [
        {
          step: 1,
          title: "Get SAS Token",
          description:
            "Call the Get SAS Token endpoint to obtain a blobSasUrl. The token is valid for 30 minutes.",
          method: "GET",
          path: "/file/api/upload/sas-token?fileName={fileName}",
          auth: "XP-API-KEY",
          note: "The fileName must be URL-encoded.",
        },
        {
          step: 2,
          title: "Upload Binary to Azure Blob Storage",
          description:
            "Upload the file binary directly to the blobSasUrl via a PUT request. The SAS URL already contains authentication, so no Authorization header is required. This request goes directly to Azure — not to the Perso API server.",
          method: "PUT",
          path: "{blobSasUrl}",
          auth: "None",
          headers: {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": "application/octet-stream",
          },
          note: "Returns 201 Created on success (empty body). A 403 means the SAS token has expired — call Get SAS Token again.",
          codeExample: `curl -X PUT \\
  -H "x-ms-blob-type: BlockBlob" \\
  -H "Content-Type: application/octet-stream" \\
  --data-binary @"/path/to/file.mp4" \\
  "{blobSasUrl}"`,
        },
        {
          step: 3,
          title: "Register Uploaded File",
          description:
            "Call Upload Video or Upload Audio to register the file. Pass the blobSasUrl as fileUrl. Stripping the query string (the '?...' portion) is recommended — the file still registers with it included, but stripping it keeps the stored path stable.",
          method: "PUT",
          path: "/file/api/upload/video (or /audio)",
          auth: "XP-API-KEY",
          note: "The response includes a seq (media sequence) — use this as mediaSeq when requesting a translation via the Dubbing API.",
        },
        {
          step: 4,
          title: "Validate Media (Optional)",
          description:
            "Call Validate Media to pre-check file constraints (extension, size, duration, resolution) before upload. This is optional but recommended to fail fast instead of waiting for a long upload to fail.",
          method: "POST",
          path: "/file/api/v1/media/validate",
          auth: "XP-API-KEY",
          note: "Can be called before Step 2 to avoid uploading an invalid file.",
        },
      ],
    },
    {
      id: "external-upload-flow",
      title: "External Platform Upload (YouTube, TikTok, Google Drive)",
      description:
        "Import videos from external platforms. The server downloads the video on your behalf.",
      steps: [
        {
          step: 1,
          title: "Get External Metadata",
          description:
            "Preview the media info (duration, resolution, size) before uploading.",
          method: "POST",
          path: "/file/api/v1/video-translator/external/metadata",
          auth: "XP-API-KEY",
        },
        {
          step: 2,
          title: "Validate Media",
          description:
            "Check constraints (size, duration, resolution) against your plan limits.",
          method: "POST",
          path: "/file/api/v1/media/validate",
          auth: "XP-API-KEY",
          note: "Validates in 1-2 seconds. Skipping this step may result in a 10+ second wait before an error on invalid media.",
        },
        {
          step: 3,
          title: "Upload External Video",
          description:
            "Start the import. This is synchronous — the server downloads the file before responding (may take up to 10 minutes).",
          method: "PUT",
          path: "/file/api/upload/video/external",
          auth: "XP-API-KEY",
          note: "The response includes a seq for use as mediaSeq in the Dubbing API.",
        },
      ],
    },
  ],
  endpoints: [
    {
      id: "upload-video",
      method: "PUT",
      path: "/file/api/upload/video",
      title: "Upload Video",
      description:
        "Upload a video file via URL. The server downloads the file from the given URL and stores it. Before calling this endpoint, you must first obtain a SAS token via the Get SAS Token endpoint and upload the file to the returned blobSasUrl. Pass the blob URL as the fileUrl parameter. The response includes a seq (media sequence) which is used as mediaSeq when requesting a translation. Note: videoFilePath and thumbnailFilePath in the response are relative paths containing perso-storage. To access the actual file, prepend https://portal-media.perso.ai (e.g. https://portal-media.perso.ai/perso-storage/.../video.mp4). The originalName in the response has its file extension removed (e.g. 'my_video.mp4' becomes 'my_video').",
      requestBody: {
        fields: [
          {
            name: "spaceSeq",
            type: "integer",
            required: true,
            description: "The unique identifier of the space.",
          },
          {
            name: "fileUrl",
            type: "string",
            required: true,
            description:
              "Direct access URL of the video file (the blobSasUrl from the SAS token step). Stripping the '?...' query string is recommended for a stable storage path, though it also registers with the query string included.",
          },
          {
            name: "fileName",
            type: "string",
            required: true,
            description:
              "File name. URL-encoded names are automatically decoded.",
          },
        ],
        example: `{
  "spaceSeq": 1,
  "fileUrl": "https://example.com/video.mp4",
  "fileName": "my_video.mp4"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "seq": 456,
  "originalName": "my_video",
  "videoFilePath": "/container/directory/uuid_20260219.mp4",
  "thumbnailFilePath": "/container/directory/uuid_20260219.webp",
  "size": 52428800,
  "durationMs": 30000,
  "fastMode": false
}`,
      },
      errors: [
        {
          code: "F4003",
          status: 400,
          description: "Missing required parameter",
        },
        {
          code: "F4004",
          status: 400,
          description: "File size limit exceeded",
        },
        { code: "F4007", status: 400, description: "Invalid video type" },
        { code: "F4001", status: 401, description: "Unauthorized" },
      ],
    },
    {
      id: "upload-audio",
      method: "PUT",
      path: "/file/api/upload/audio",
      title: "Upload Audio",
      description:
        "Upload an audio file via URL. The server downloads the file from the given URL and stores it. Before calling this endpoint, you must first obtain a SAS token via the Get SAS Token endpoint and upload the file to the returned blobSasUrl. Pass the blob URL as the fileUrl parameter. The response includes a seq (media sequence) which is used as mediaSeq when requesting a translation. Note: audioFilePath and thumbnailFilePath in the response are relative paths containing perso-storage. To access the actual file, prepend https://portal-media.perso.ai (e.g. https://portal-media.perso.ai/perso-storage/.../audio.mp3). The originalName in the response has its file extension removed (e.g. 'my_audio.mp3' becomes 'my_audio').",
      requestBody: {
        fields: [
          {
            name: "spaceSeq",
            type: "integer",
            required: true,
            description: "The unique identifier of the space.",
          },
          {
            name: "fileUrl",
            type: "string",
            required: true,
            description:
              "Direct access URL of the audio file (the blobSasUrl from the SAS token step). Stripping the '?...' query string is recommended for a stable storage path, though it also registers with the query string included.",
          },
          {
            name: "fileName",
            type: "string",
            required: true,
            description:
              "File name. URL-encoded names are automatically decoded.",
          },
        ],
        example: `{
  "spaceSeq": 1,
  "fileUrl": "https://portal-media.perso.ai/perso-storage/...",
  "fileName": "my_audio.mp3"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "seq": 789,
  "originalName": "my_audio",
  "audioFilePath": "/container/directory/uuid_20260219.mp3",
  "thumbnailFilePath": "audio_thumb.png",
  "size": 5242880,
  "durationMs": 180000,
  "fastMode": false
}`,
      },
      errors: [
        {
          code: "F4003",
          status: 400,
          description: "Missing required parameter",
        },
        {
          code: "F4004",
          status: 400,
          description: "File size limit exceeded",
        },
        { code: "F4007", status: 400, description: "Invalid audio type" },
        { code: "F4001", status: 401, description: "Unauthorized" },
      ],
    },
    {
      id: "upload-external",
      method: "PUT",
      path: "/file/api/upload/video/external",
      title: "Upload External Video",
      description:
        "Upload a video from an external platform (YouTube, TikTok, Google Drive). This is a synchronous operation — the server waits for the download to complete before responding. Timeout may take up to 10 minutes. Note: videoFilePath, audioFilePath, and thumbnailFilePath in the response are relative paths containing perso-storage. To access the actual file, prepend https://portal-media.perso.ai (e.g. https://portal-media.perso.ai/perso-storage/.../video.mp4).",
      requestBody: {
        fields: [
          {
            name: "space_seq",
            type: "integer",
            required: true,
            description: "The unique identifier of the space.",
          },
          {
            name: "url",
            type: "string",
            required: true,
            description: "External video URL (YouTube, TikTok, Google Drive).",
          },
          {
            name: "lang",
            type: "string",
            required: false,
            description: "Language code.",
            default: "en",
          },
        ],
        example: `{
  "space_seq": 1,
  "url": "https://www.youtube.com/watch?v=xxxxx",
  "lang": "ko"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "seq": 456,
  "originalName": "Video Title",
  "videoFilePath": "/container/directory/uuid_20260219.mp4",
  "thumbnailFilePath": "/container/directory/uuid_20260219.webp",
  "size": 52428800,
  "durationMs": 30000
}`,
      },
      errors: [
        {
          code: "F4003",
          status: 400,
          description: "Missing required parameter",
        },
        {
          code: "F4006",
          status: 400,
          description: "Not a valid external link",
        },
        {
          code: "F40012",
          status: 400,
          description: "Region unavailable external video",
        },
        {
          code: "F40014",
          status: 400,
          description: "Members only content",
        },
        {
          code: "F40015",
          status: 400,
          description: "Payment required content",
        },
        { code: "F40016", status: 400, description: "Invalid YouTube URL" },
        { code: "F4001", status: 401, description: "Unauthorized" },
        {
          code: "F4031",
          status: 403,
          description: "Unaccessible Google Drive link",
        },
        {
          code: "F4032",
          status: 403,
          description: "Geo-restricted YouTube video",
        },
        {
          code: "F4033",
          status: 403,
          description: "Age-restricted YouTube video",
        },
        {
          code: "F4035",
          status: 403,
          description: "Unaccessible external media link",
        },
      ],
    },
    {
      id: "sas-token",
      method: "GET",
      path: "/file/api/upload/sas-token",
      title: "Get SAS Token",
      description:
        "Issue an Azure Blob Storage SAS token for direct file upload. This is the first step for uploading video or audio files. The token expires 30 minutes after issuance. Upload your file to the returned blobSasUrl via a PUT request before the expiration time, then call the Upload Video or Upload Audio endpoint with the blob URL. Use the blobSasUrl host exactly as returned — do not hardcode it, as it may be perso-saas-file-frontdoor.perso.ai rather than portal-media.perso.ai. Note that expirationDatetime is a naive UTC timestamp with no timezone suffix; do not parse it and compare against local time (that makes it look already expired or near-expiry) — simply upload within 30 minutes of issuance.",
      queryParams: [
        {
          name: "fileName",
          type: "string",
          required: true,
          description: "File name (URL encoding required).",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "blobSasUrl": "https://perso-saas-file-frontdoor.perso.ai/perso-storage/{path}/uuid_20260720.mp4?sv=2024-11-04&se=2026-02-19T13%3A00%3A00Z&sr=b&sp=rw&sig=...",
  "expirationDatetime": "2026-02-19T13:00:00"
}`,
      },
      errors: [
        {
          code: "F4003",
          status: 400,
          description: "Missing required parameter",
        },
        { code: "F4001", status: 401, description: "Unauthorized" },
      ],
    },
    {
      id: "validate-media",
      method: "POST",
      path: "/file/api/v1/media/validate",
      title: "Validate Media",
      description:
        "Pre-validate media file metadata before upload. Checks extension, file size, duration, and resolution constraints without transferring the actual file.",
      requestBody: {
        fields: [
          {
            name: "spaceSeq",
            type: "integer",
            required: true,
            description: "The unique identifier of the space.",
          },
          {
            name: "durationMs",
            type: "integer",
            required: true,
            description: "Media duration in milliseconds.",
          },
          {
            name: "originalName",
            type: "string",
            required: true,
            description: "Original file name.",
          },
          {
            name: "mediaType",
            type: "string",
            required: true,
            description: "Type of the media file.",
            enum: ["video", "audio"],
          },
          {
            name: "extension",
            type: "string",
            required: true,
            description: "File extension.",
            enum: [".mp4", ".webm", ".mov", ".mp3", ".wav"],
          },
          {
            name: "size",
            type: "integer",
            required: false,
            description: "File size in bytes (max 2GB).",
          },
          {
            name: "width",
            type: "integer",
            required: false,
            description:
              "Video width in pixels. Required when mediaType is 'video'. Min 201, max 7999.",
          },
          {
            name: "height",
            type: "integer",
            required: false,
            description:
              "Video height in pixels. Required when mediaType is 'video'. Min 201, max 7999.",
          },
          {
            name: "thumbnailFilePath",
            type: "string",
            required: false,
            description: "Thumbnail file path.",
          },
        ],
        example: `{
  "spaceSeq": 1,
  "durationMs": 30000,
  "originalName": "video.mp4",
  "mediaType": "video",
  "extension": ".mp4",
  "size": 52428800,
  "width": 1920,
  "height": 1080,
  "thumbnailFilePath": null
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "status": true
}`,
      },
      errors: [
        {
          code: "F4003",
          status: 400,
          description: "Missing required parameter",
        },
        {
          code: "F4004",
          status: 400,
          description: "File size limit exceeded",
        },
        {
          code: "F4007",
          status: 400,
          description: "Invalid video/audio type",
        },
        {
          code: "F4008",
          status: 400,
          description: "Video duration limit exceeded",
        },
        {
          code: "F4009",
          status: 400,
          description: "Video duration too short (min 5s)",
        },
        {
          code: "F40010",
          status: 400,
          description: "Video resolution limit exceeded",
        },
        {
          code: "F40011",
          status: 400,
          description: "Video resolution too low",
        },
        { code: "F4001", status: 401, description: "Unauthorized" },
        {
          code: "F4005",
          status: 403,
          description: "Plan usage limit exceeded",
        },
        { code: "F4220", status: 422, description: "Validation failed" },
      ],
    },
    {
      id: "external-metadata",
      method: "POST",
      path: "/file/api/v1/video-translator/external/metadata",
      title: "Get External Metadata",
      description:
        "Retrieve metadata from an external platform video (YouTube, TikTok, Google Drive) without downloading the file. Use this to preview media info before uploading.",
      requestBody: {
        fields: [
          {
            name: "space_seq",
            type: "integer",
            required: true,
            description: "The unique identifier of the space.",
          },
          {
            name: "url",
            type: "string",
            required: true,
            description: "External video URL (YouTube, TikTok, Google Drive).",
          },
          {
            name: "lang",
            type: "string",
            required: false,
            description: "Language code.",
            default: "en",
          },
        ],
        example: `{
  "space_seq": 1,
  "url": "https://www.youtube.com/watch?v=xxxxx",
  "lang": "ko"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "durationMs": 215000,
  "originalName": "Video Title",
  "thumbnailFilePath": "https://i.ytimg.com/vi/xxxxx/maxresdefault.jpg",
  "mediaType": "video",
  "size": 52428800,
  "extension": ".mp4",
  "width": 1920,
  "height": 1080
}`,
      },
      errors: [
        {
          code: "F4003",
          status: 400,
          description: "Missing required parameter",
        },
        {
          code: "F4006",
          status: 400,
          description: "Not a valid external link",
        },
        { code: "F40016", status: 400, description: "Invalid YouTube URL" },
        { code: "F40017", status: 400, description: "Invalid media URL" },
        { code: "F4001", status: 401, description: "Unauthorized" },
        {
          code: "F4031",
          status: 403,
          description: "Unaccessible Google Drive link",
        },
        {
          code: "F4035",
          status: 403,
          description: "Unaccessible external media link",
        },
      ],
    },
    {
      id: "download-info",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/download-info",
      title: "Check Download Availability",
      description:
        "Before downloading files, check which files are currently available for download in your project. Each field returns true/false to indicate availability. Some fields may return null depending on the project type (video vs audio). Use the corresponding download target value for any field that returned true when calling the download endpoint.\n\n" +
        "Mapping between download-info boolean fields and download target values:\n" +
        "- hasTranslatedVideo -> target=dubbingVideo\n" +
        "- hasLipSyncVideo -> target=lipSyncVideo\n" +
        "- hasOriginalVoiceOnly -> target=originalVoiceAudio (original voice track)\n" +
        "- hasTranslatedVoice -> target=voiceAudio (translated voice; returns 500 if the project has no translated voice, e.g. Audio Separation projects)\n" +
        "- hasOriginalBackground / hasTranslatedBackground -> target=backgroundAudio\n" +
        "- hasOriginalSpeakerAudioCollection -> target=originalVoiceSpeakers\n" +
        "- hasSpeakerSegmentExcel -> target=speakerSegmentExcel\n" +
        "- hasSpeakerSegmentWithTranslationExcel -> target=speakerSegmentWithTranslationExcel\n" +
        "- hasScriptTimestamps -> target=scriptTimestamps\n" +
        "- hasOriginalSubBackground -> target=originalSubBackground\n" +
        "- hasZipDownload -> target=all (.tar archive)\n" +
        "- hasOriginalSubtitle / hasTranslatedSubtitle / hasOriginalSubtitleVtt -> no individual target; SRT/VTT files are only included in the target=all archive",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "hasPreviousProjectVideo": true,
  "hasTranslatedVideo": true,
  "hasLipSyncVideo": false,
  "hasOriginalSubtitle": true,
  "hasTranslatedSubtitle": true,
  "hasOriginalVoiceOnly": true,
  "hasTranslatedVoice": true,
  "hasOriginalBackground": true,
  "hasTranslatedBackground": true,
  "hasZipDownload": true,
  "hasOriginalSpeakerAudioCollection": false,
  "hasSpeakerSegmentExcel": true,
  "hasSpeakerSegmentWithTranslationExcel": true,
  "hasScriptTimestamps": true,
  "hasOriginalSubtitleVtt": true,
  "hasOriginalSubBackground": false
}`,
      },
    },
    {
      id: "download",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/download",
      title: "Download Files",
      description:
        "Download project output files. Use the download-info endpoint first to check which files are available, then pass the corresponding target value. All returned download links are relative paths under /perso-storage/... — prepend https://portal-media.perso.ai to fetch them, and URL-encode the path since it may contain spaces or non-ASCII characters. zippedFileDownloadLink points to a .tar archive.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      queryParams: [
        {
          name: "target",
          type: "string",
          required: true,
          description:
            "The type of file to download. Use the download-info endpoint to check which targets are available. See the download-info endpoint description for the mapping between download-info boolean fields and target values. Matching is case-insensitive (voicewithBackgroundAudio and voiceWithBackgroundAudio both work). An unknown value returns 400 VT4001; a value that is valid in the enum but not present for this project may return 500.",
          enum: [
            "dubbingVideo",
            "lipSyncVideo",
            "audioScript",
            "originalVoiceAudio",
            "voiceAudio",
            "backgroundAudio",
            "voicewithBackgroundAudio",
            "translatedAudio",
            "all",
            "originalVoiceSpeakers",
            "speakerSegmentExcel",
            "speakerSegmentWithTranslationExcel",
            "scriptTimestamps",
            "originalSubBackground",
          ],
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "videoFile": {
      "videoDownloadLink": "/perso-storage/.../dubbing_video.mp4"
    },
    "audioFile": {
      "voiceAudioDownloadLink": "/perso-storage/.../voice.wav",
      "backgroundAudioDownloadLink": "/perso-storage/.../background.wav",
      "voiceWithBackgroundAudioDownloadLink": "/perso-storage/.../voice_with_background.wav"
    },
    "srtFile": {
      "originalSubtitleDownloadLink": "/perso-storage/.../original.srt",
      "translatedSubtitleDownloadLink": "/perso-storage/.../translated.srt",
      "originalSubtitleVttDownloadLink": "/perso-storage/.../original.vtt"
    },
    "zippedFileDownloadLink": "/perso-storage/.../export.tar"
  }
}`,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Dubbing API
// ---------------------------------------------------------------------------
export const dubbingCategory: ApiCategory = {
  slug: "dubbing",
  title: "Dubbing API",
  description:
    "Core endpoints for video translation, project management, and file downloads.",
  guides: [
    {
      id: "dubbing-workflow",
      title: "End-to-End Dubbing Workflow",
      description:
        "Complete workflow from file upload to downloading the translated result.",
      steps: [
        {
          step: 1,
          title: "Upload Media",
          description:
            "Upload your video or audio file using the File API. See the File API page for the detailed upload flow (SAS token → Azure Blob upload → register). The response seq value is your mediaSeq for the next step.",
          note: "Refer to the File API 'Direct File Upload' or 'External Platform Upload' guide.",
        },
        {
          step: 2,
          title: "Initialize Queue",
          description:
            "Call the Usage API's Get User Queue endpoint to ensure the space has a translation queue. Despite being named 'Get User Queue', calling it with PUT creates/initializes the queue. Without this, the first translation request in a new space will fail with 'space queue not found'.",
          method: "PUT",
          path: "/video-translator/api/v1/projects/spaces/{spaceSeq}/queue",
          auth: "XP-API-KEY",
          note: "Only required once per space. Subsequent translations do not need this step.",
        },
        {
          step: 3,
          title: "Request Translation",
          description:
            "Submit the translation request with the mediaSeq from Step 1. Use sourceLanguageCode 'auto' for automatic detection, or a specific code from the Language API.",
          method: "POST",
          path: "/video-translator/api/v1/projects/spaces/{spaceSeq}/translate",
          auth: "XP-API-KEY",
        },
        {
          step: 4,
          title: "Poll Progress",
          description:
            "Poll the project status every 5 seconds. progressReason values: Enqueue Pending | Slow Mode Pending | Uploading | Transcribing | Translating | Generating Voice | Analyzing Lip Sync | Applying Lip Sync | Completed | Failed.",
          method: "GET",
          path: "/video-translator/api/v1/projects/{projectSeq}/space/{spaceSeq}/progress",
          auth: "XP-API-KEY",
          note: "Do not poll more frequently than every 5 seconds.",
        },
        {
          step: 5,
          title: "Download Result",
          description:
            "Once complete, download the output files. Use the download-info endpoint first to check available file types.",
          method: "GET",
          path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/download?target=dubbingVideo",
          auth: "XP-API-KEY",
          note: "Working target values: dubbingVideo, lipSyncVideo, voiceAudio, originalVoiceAudio, backgroundAudio, voicewithBackgroundAudio, originalVoiceSpeakers, speakerSegmentExcel, speakerSegmentWithTranslationExcel, scriptTimestamps, originalSubBackground, audioScript, all. Subtitles (SRT) cannot be fetched as an individual target — they are only delivered inside the target=all archive (.tar). Requesting a file that download-info reports as false may return 500 rather than a 4xx.",
        },
      ],
    },
  ],
  endpoints: [
    {
      id: "translate",
      method: "POST",
      path: "/video-translator/api/v1/projects/spaces/{spaceSeq}/translate",
      title: "Request Translation",
      description:
        "Submit a video or audio translation request based on uploaded media files. The mediaSeq is the seq value returned from the Upload Video or Upload Audio endpoint in the File API. New integrations should use `targetLanguages` (per-language TTS model selection). The legacy `targetLanguageCodes` + `ttsModel` pair is still accepted for backward compatibility, but is deprecated. " +
        "If you receive a 'space queue not found' error, you must first call the PUT /video-translator/api/v1/projects/spaces/{spaceSeq}/queue endpoint (Usage API) to initialize the queue before retrying.",
      pathParams: [
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      requestBody: {
        fields: [
          {
            name: "mediaSeq",
            type: "integer",
            required: true,
            description:
              "The media sequence (seq) returned from the Upload Video or Upload Audio API response.",
          },
          {
            name: "isVideoProject",
            type: "boolean",
            required: true,
            description:
              "Whether this is a video project (true) or audio project (false).",
          },
          {
            name: "sourceLanguageCode",
            type: "string",
            required: true,
            description:
              "Source language code. Use 'auto' for automatic language detection, or a specific code from the Language API (e.g. 'en', 'ko'). Do not send an empty string — use 'auto' instead.",
          },
          {
            name: "targetLanguageCodes",
            type: "string[]",
            required: false,
            description:
              "(Deprecated since 2026-05-14) Array of target language codes to translate into. " +
              "New integrations should use `targetLanguages` instead. " +
              "If both fields are provided, `targetLanguages` takes precedence. " +
              "Either `targetLanguageCodes` or `targetLanguages` must be provided.",
          },
          {
            name: "targetLanguages",
            type: "object[]",
            required: false,
            description:
              "Recommended. List of target language and TTS model pairs. " +
              "When provided, this field takes precedence over `targetLanguageCodes` and the top-level `ttsModel`. " +
              "Either `targetLanguageCodes` or `targetLanguages` must be provided.",
            fields: [
              {
                name: "languageCode",
                type: "string",
                required: true,
                description:
                  "Target language code (e.g. 'en', 'ko'). Must be a valid code returned by the Language API.",
              },
              {
                name: "ttsModel",
                type: "string",
                required: false,
                enum: ["AUDIO_ENGINE_V3", "ELEVEN_V2", "ELEVEN_V3"],
                description:
                  "TTS model to apply to this language. Optional even for DUBBING / LIPSYNC — " +
                  "if omitted, the server applies a default model supported by the language. " +
                  "The specific default is not documented, so specify `ttsModel` explicitly if you need deterministic behavior. " +
                  "If specified, it must be one of the target language's supportedTtsModels " +
                  "or the request fails with 400 VT4009 (UNSUPPORTED_LANGUAGE_TTS_MODEL_PAIR). " +
                  "Check the Language API's supportedTtsModels for the target language before specifying. " +
                  "Ignored for STT / AudioSeparation requests (may be omitted).",
              },
            ],
          },
          {
            name: "numberOfSpeakers",
            type: "integer",
            required: false,
            default: "1",
            description:
              "Number of speakers in the video for multi-speaker detection.",
          },
          {
            name: "preferredSpeedType",
            type: "string",
            required: true,
            description: "Processing speed preference.",
            enum: ["GREEN", "RED"],
          },
          {
            name: "withLipSync",
            type: "boolean",
            required: false,
            description: "Whether to include lip sync processing.",
          },
          {
            name: "customDictionaryBlobPath",
            type: "string",
            required: false,
            description: "Storage path to a custom dictionary file.",
          },
          {
            name: "srtBlobPath",
            type: "string",
            required: false,
            description: "Storage path to an SRT subtitle file.",
          },
          {
            name: "ttsModel",
            type: "string",
            required: false,
            deprecated: true,
            description:
              "(Deprecated since 2026-05-14) Single TTS model applied to all target languages. " +
              "New integrations should specify `ttsModel` per language inside `targetLanguages`. " +
              "AUDIO_ENGINE_V3 (all languages), ELEVEN_V2 (natural), or ELEVEN_V3 (emotional). " +
              "Each value must be in the target language's supportedTtsModels (see the Language API).",
            enum: ["AUDIO_ENGINE_V3", "ELEVEN_V2", "ELEVEN_V3"],
          },
          {
            name: "title",
            type: "string",
            required: false,
            description:
              "Project title. If omitted, the media file name is used.",
          },
        ],
        example: `{
  "mediaSeq": 12345,
  "isVideoProject": true,
  "sourceLanguageCode": "en",
  "targetLanguages": [
      { "languageCode": "ko", "ttsModel": "ELEVEN_V3" },
      { "languageCode": "ja", "ttsModel": "ELEVEN_V3" }
  ],
  "numberOfSpeakers": 2,
  "withLipSync": false,
  "preferredSpeedType": "GREEN",
  "title": "My Translation Project"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "startGenerateProjectIdList": [101, 102]
  }
}`,
      },
      errors: [
        {
          code: "VT4043",
          status: 404,
          description: "Source language not found",
        },
        {
          code: "VT4044",
          status: 404,
          description: "Target language not found",
        },
        { code: "VT4042", status: 404, description: "Video not found" },
        { code: "VT5034", status: 503, description: "Queue full" },
        {
          code: "VT4021",
          status: 402,
          description: "Insufficient credits",
        },
        {
          code: "VT4009",
          status: 400,
          description: "Target language and TTS model pair is not supported",
        },
      ],
    },
    {
      id: "get-project",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}",
      title: "Get Project",
      description:
        "Retrieve detailed information about a specific translation project. The progressReason field indicates the current status: Enqueue Pending | Slow Mode Pending | Uploading | Transcribing | Translating | Generating Voice | Analyzing Lip Sync | Applying Lip Sync | Completed | Failed.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "seq": 101,
  "projectType": "VIDEO",
  "title": "My Translation Project",
  "userName": "oh****on",
  "isEditable": true,
  "durationMs": 120000,
  "sourceLanguage": {
    "code": "en",
    "name": "English"
  },
  "targetLanguage": {
    "code": "ko",
    "name": "Korean"
  },
  "progress": 100,
  "progressReason": "Completed",
  "hasFailed": false,
  "failureReason": null,
  "isLipSync": false,
  "isLinkShared": false,
  "projectGenerationType": "DUBBING",
  "usedFeature": [],
  "experimentList": [],
  "thumbnailUrl": "https://...",
  "createDate": "2026-01-15T10:30:00Z",
  "updateDate": "2026-01-15T11:00:00Z"
}`,
      },
      errors: [
        { code: "VT4041", status: 404, description: "Project not found" },
        { code: "VT4045", status: 404, description: "Project deleted" },
        { code: "VT4031", status: 403, description: "Access denied" },
        {
          code: "VT4091",
          status: 409,
          description: "Video generation failed",
        },
      ],
    },
    {
      id: "list-projects",
      method: "GET",
      path: "/video-translator/api/v1/projects/spaces/{spaceSeq}",
      title: "List Projects",
      description: "Retrieve a list of active projects within a space.",
      pathParams: [
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      queryParams: [
        {
          name: "memberRole",
          type: "string",
          required: true,
          description: "The role of the member requesting the list.",
          enum: [
            "enterprise_owner",
            "space_owner",
            "space_manager",
            "space_member",
            "individual",
            "developer",
          ],
        },
        {
          name: "size",
          type: "integer",
          required: true,
          description: "Number of items per page.",
        },
        {
          name: "offset",
          type: "integer",
          required: true,
          description: "Starting position for pagination.",
        },
        {
          name: "sortType",
          type: "string",
          required: false,
          description: "Sort field.",
          default: "update_date",
          enum: ["update_date", "title"],
        },
        {
          name: "sortDirection",
          type: "string",
          required: true,
          description: "Sort direction.",
          enum: ["asc", "desc"],
        },
        {
          name: "type",
          type: "string",
          required: false,
          description: "Filter by project generation type.",
          enum: ["DUBBING", "LIP_SYNC"],
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "totalCount": 100,
  "hasNext": true,
  "pageSize": 10,
  "nextVtOffset": 10,
  "content": [
    {
      "seq": 1,
      "title": "My Project",
      "projectType": "VIDEO",
      "durationMs": 120000,
      "sourceLanguage": {
        "code": "en",
        "name": "English"
      },
      "targetLanguage": {
        "code": "ko",
        "name": "Korean"
      },
      "progress": 100,
      "hasFailed": false,
      "status": "created",
      "projectGenerationType": "DUBBING",
      "createDate": "2026-01-15T10:00:00Z"
    }
  ]
}`,
      },
    },
    {
      id: "get-script",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/script",
      title: "Get Script",
      description:
        "Retrieve the project script with sentence-level translations, matching rates, and speaker information. matchingRate and rewrite can be null for a given sentence. Each speaker exposes a projectSpeakerSeq, which is the value required by the Temp Save Draft endpoint.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      queryParams: [
        {
          name: "cursorId",
          type: "integer",
          required: false,
          description:
            "Cursor-based pagination ID. Omit for the first request.",
        },
        {
          name: "size",
          type: "integer",
          required: false,
          description: "Number of sentences per page.",
          default: "10000",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "hasNext": false,
  "nextCursorId": null,
  "retranslateAvailable": true,
  "sentences": [
    {
      "seq": 1,
      "externalScriptSeq": "pvtv-e1045225d769af98305367b722c1adfb",
      "speakerOrderIndex": 0,
      "offsetMs": 0,
      "durationMs": 3500,
      "originalDraftText": "Hello, welcome.",
      "originalText": "Hello, welcome.",
      "translatedText": "...",
      "proofRead": false,
      "audioUrl": "/perso-storage/.../audio.mp3",
      "matchingRate": {
        "level": 3,
        "levelType": "GOOD"
      },
      "rewrite": {
        "speed": "normal",
        "current": 120
      }
    }
  ],
  "speakers": [
    {
      "speakerOrderIndex": 0,
      "externalSpeakerSeq": "spk_001",
      "projectSpeakerSeq": 12345,
      "voiceId": "pvsp-1351dafa5135"
    }
  ]
}`,
      },
    },
    {
      id: "progress",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/space/{spaceSeq}/progress",
      title: "Poll Progress",
      description:
        "Poll the current progress of a translation project. Recommended polling interval: every 5 seconds. Completion: progressReason === 'Completed'. Failure: progressReason === 'Failed'. Do not poll more frequently than every 5 seconds to avoid rate limiting. progressReason values: Enqueue Pending | Slow Mode Pending | Uploading | Transcribing | Translating | Generating Voice | Analyzing Lip Sync | Applying Lip Sync | Completed | Failed.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "projectSeq": 101,
    "progress": 65,
    "progressReason": "Transcribing",
    "hasFailed": false,
    "failureReason": null,
    "engineErrorMessage": null,
    "speedType": "fast",
    "expectedRemainingTimeMinutes": 3,
    "isCancelable": true
  }
}`,
      },
    },
    {
      id: "cancel",
      method: "POST",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/cancel",
      title: "Cancel Project",
      description:
        "Cancel a pending project. Only available for GREEN zone projects in PENDING initial export state. Cancellation only works while the project is still queued (pending); when the GREEN queue is empty, processing starts immediately, so a 400 VT4004 (cancellation not allowed) is common even right after creation.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 201,
        example: `{
  "result": {}
}`,
      },
      errors: [
        {
          code: "VT4004",
          status: 400,
          description: "Cancellation not allowed",
        },
        {
          code: "VT4033",
          status: 403,
          description: "No access to the space",
        },
      ],
    },
    {
      id: "get-share",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/share",
      title: "Get Share Link",
      description:
        "Retrieve the encrypted share query string for sharing a project externally.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "shareQuery": "eyJhbGciOiJIUzI1NiJ9..."
}`,
      },
    },
    {
      id: "toggle-share",
      method: "PATCH",
      path: "/video-translator/api/v1/projects/{projectSeq}/share",
      title: "Toggle Share",
      description: "Enable or disable the share URL for a project.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
      ],
      queryParams: [
        {
          name: "sharedStatus",
          type: "boolean",
          required: true,
          description: "Whether to enable (true) or disable (false) sharing.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "projectSeq": 1,
    "sharedStatus": true
  }
}`,
      },
    },
    {
      id: "video-info",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/video-info",
      title: "Get Video Info",
      description:
        "Retrieve metadata for an individual video including title, duration, resolution, and status.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "title": "My Video",
  "thumbnailUrl": "https://...",
  "type": "VIDEO",
  "durationMs": 120000,
  "videoStatus": "COMPLETED",
  "language": "ko",
  "aspectRatio": "16:9",
  "resolution": "1920x1080",
  "sizeByte": 52428800
}`,
      },
      errors: [
        {
          code: "VT4033",
          status: 403,
          description: "No access to the space",
        },
        { code: "VT4041", status: 404, description: "Project not found" },
        { code: "VT4042", status: 404, description: "Video not found" },
      ],
    },
    {
      id: "export-history",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/space/{spaceSeq}/export-history",
      title: "Get Export History",
      description:
        "Retrieve the export and upload history for a project with pagination.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      queryParams: [
        {
          name: "page",
          type: "integer",
          required: false,
          description: "Page number (zero-based).",
          default: "0",
        },
        {
          name: "size",
          type: "integer",
          required: false,
          description: "Number of items per page.",
        },
        {
          name: "sort",
          type: "string",
          required: false,
          description: "Sort criteria.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "page": 1,
    "totalPages": 10,
    "hasNext": true,
    "currentPageSize": 100,
    "contents": [
      {
        "exportDate": "2026-01-15T10:00:00Z",
        "projectTitle": "My Project",
        "isLipSync": true,
        "exportZipDownloadPath": "/export.zip"
      }
    ]
  }
}`,
      },
    },
    {
      id: "retranslation-status",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/retranslation/status",
      title: "Check Retranslation Status",
      description: "Check whether retranslation is available for a project.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "retranslateAvailable": true
}`,
      },
    },
    {
      id: "used-features",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/used-features",
      title: "Get Used Features",
      description:
        "Check which optional features were used when creating the project, such as custom dictionary or SRT upload.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "usedCustomDictionary": false,
    "usedSrtUpload": false
  }
}`,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Editing API
// ---------------------------------------------------------------------------
export const editingCategory: ApiCategory = {
  slug: "editing",
  title: "Editing API",
  description:
    "Edit, translate, and manage individual audio sentences within a project.",
  endpoints: [
    {
      id: "translate-sentence",
      method: "PATCH",
      path: "/video-translator/api/v1/project/{projectSeq}/audio-sentence/{sentenceSeq}",
      title: "Translate Sentence",
      description:
        "Request translation or retranslation for a specific sentence within a project.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "sentenceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the sentence.",
        },
      ],
      requestBody: {
        fields: [
          {
            name: "targetText",
            type: "string",
            required: true,
            description: "The text to translate or the updated translation.",
          },
        ],
        example: `{
  "targetText": "Updated translation text"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "scriptSeq": 1,
    "translatedText": "Updated translation text",
    "matchingRate": {
      "level": 4,
      "levelType": "EXCELLENT"
    },
    "rewrite": {
      "speed": "normal",
      "current": 115,
      "optimal": {
        "min": 80,
        "max": 150
      }
    }
  }
}`,
      },
    },
    {
      id: "generate-audio",
      method: "PATCH",
      path: "/video-translator/api/v1/project/{projectSeq}/audio-sentence/{audioSentenceSeq}/generate-audio",
      title: "Generate Audio",
      description: "Generate a translated audio file for a specific sentence.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "audioSentenceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the audio sentence.",
        },
      ],
      requestBody: {
        fields: [
          {
            name: "targetText",
            type: "string",
            required: true,
            description: "The text to generate audio for.",
          },
        ],
        example: `{
  "targetText": "Text to generate audio for"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "scriptSeq": 1,
    "translatedText": "Text to generate audio for",
    "generateAudioFilePath": "/audio/1.mp3",
    "matchingRate": {
      "level": 3,
      "levelType": "Low"
    },
    "rewrite": {
      "speed": "fast",
      "current": 3,
      "optimal": {
        "min": 101,
        "max": 120
      }
    }
  }
}`,
      },
    },
    {
      id: "reset-translation",
      method: "PUT",
      path: "/video-translator/api/v1/project/{projectSeq}/audio-sentence/{audioSentenceSeq}/reset",
      title: "Reset Translation",
      description: "Reset a translation back to its original proofread state.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "audioSentenceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the audio sentence.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "speakerSeq": "pvsp-1351dafa5135",
    "proofreadOriginalText": "Hello",
    "proofreadTranslatedText": "Hello"
  }
}`,
      },
    },
    {
      id: "cancel-translation",
      method: "PUT",
      path: "/video-translator/api/v1/project/{projectSeq}/audio-sentence/{audioSentenceSeq}/cancel",
      title: "Cancel Translation",
      description: "Cancel an in-progress translation for a specific sentence.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "audioSentenceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the audio sentence.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {}
}`,
      },
    },
    {
      id: "temp-save",
      method: "POST",
      path: "/video-translator/api/v1/project/{projectSeq}/audio-sentence/{audioSentenceSeq}/temp-save",
      title: "Temp Save Draft",
      description:
        "Temporarily save a translation draft for a paragraph without triggering full processing.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "audioSentenceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the audio sentence.",
        },
      ],
      requestBody: {
        fields: [
          {
            name: "originalDraftText",
            type: "string",
            required: true,
            description: "The draft original text to temporarily save.",
          },
          {
            name: "projectSpeakerSeq",
            type: "integer",
            required: true,
            description:
              "The speaker identifier to temporarily assign. Required for project version 2 speaker changes. Obtain it from the speakers[].projectSpeakerSeq field of the Get Script response.",
          },
        ],
        example: `{
  "originalDraftText": "Draft translation text",
  "projectSpeakerSeq": 12345
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "result": null
}`,
      },
    },
    {
      id: "match-rewrite",
      method: "POST",
      path: "/video-translator/api/v1/project/{projectSeq}/audio-sentence/{audioSentenceSeq}/match-rewrite",
      title: "Get Match Rate & Rewrite",
      description:
        "Query the matching rate and rewrite information for a translated sentence to evaluate translation quality.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "audioSentenceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the audio sentence.",
        },
      ],
      requestBody: {
        fields: [
          {
            name: "targetText",
            type: "string",
            required: true,
            description: "The translated text to evaluate.",
          },
        ],
        example: `{
  "targetText": "Translation text to evaluate"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "matchingRate": {
      "level": 3,
      "levelType": "Low"
    },
    "rewrite": {
      "speed": "fast",
      "current": 3,
      "optimal": {
        "min": 101,
        "max": 120
      }
    }
  }
}`,
      },
    },
    {
      id: "proofread",
      method: "POST",
      path: "/video-translator/api/v1/project/{projectSeq}/space/{spaceSeq}/proofread",
      title: "Request Proofread",
      description:
        "Submit a proofread request for the project's translations. This re-processes all translations with quality improvements.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      requestBody: {
        fields: [
          {
            name: "isLipSync",
            type: "boolean",
            required: false,
            description: "Whether to enable lip sync for the proofread output.",
          },
          {
            name: "experimentKey",
            type: "string",
            required: false,
            description: "Experiment key for A/B testing configurations.",
          },
          {
            name: "preferredSpeedType",
            type: "string",
            required: true,
            description: "Processing speed preference.",
            enum: ["GREEN", "RED"],
          },
        ],
        example: `{
  "isLipSync": false,
  "preferredSpeedType": "GREEN"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "result": {}
}`,
      },
    },
    {
      id: "update-title",
      method: "PATCH",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/title",
      title: "Update Title",
      description:
        "Update the title of a project. If the title is empty or null, it defaults to 'Untitled'.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      requestBody: {
        fields: [
          {
            name: "newTitle",
            type: "string",
            required: false,
            description:
              "The new project title. Defaults to 'Untitled' if empty.",
          },
        ],
        example: `{
  "newTitle": "Updated Project Name"
}`,
      },
      response: {
        statusCode: 200,
        example: `// Empty response body`,
      },
    },
    {
      id: "update-access",
      method: "PATCH",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/access",
      title: "Update Access",
      description: "Modify the access permissions for a project.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      queryParams: [
        {
          name: "permission",
          type: "string",
          required: true,
          description: "The access permission type.",
          enum: ["individual", "all"],
        },
      ],
      response: {
        statusCode: 200,
        example: `// Empty response body`,
      },
      errors: [
        {
          code: "VT4033",
          status: 403,
          description: "No access to the space",
        },
        {
          code: "VT4046",
          status: 404,
          description: "Project space not found",
        },
      ],
    },
    {
      id: "delete-project",
      method: "DELETE",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}",
      title: "Delete Project",
      description:
        "Permanently delete a project. Returns 204 No Content on success.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 204,
        example: `// No content returned`,
      },
      errors: [
        { code: "VT4041", status: 404, description: "Project not found" },
        { code: "VT4045", status: 404, description: "Project deleted" },
        { code: "VT4031", status: 403, description: "Access denied" },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Usage API
// ---------------------------------------------------------------------------
export const usageCategory: ApiCategory = {
  slug: "usage",
  title: "Usage API",
  description:
    "Monitor quota consumption, queue status, and estimated credit usage.",
  endpoints: [
    {
      id: "get-quota",
      method: "GET",
      path: "/video-translator/api/v1/projects/spaces/{spaceSeq}/plan/status",
      title: "Get User Quota",
      description:
        "Retrieve the quota information and plan status for a user within a space.",
      pathParams: [
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "spaceSeq": 12345,
    "planTier": "creator",
    "remainingQuota": {
      "remainingQuota": 500000
    },
    "resetDateTime": "2026-02-28T23:59:59Z",
    "isCancellationScheduled": false
  }
}`,
      },
    },
    {
      id: "estimate-quota",
      method: "GET",
      path: "/video-translator/api/v1/projects/spaces/{spaceSeq}/media/quota",
      title: "Estimate Quota Usage",
      description:
        "Calculate the estimated quota that will be consumed for a given media file based on its type, duration, and translation settings. Quota is measured in seconds of media (a 9-second clip costs 9); enabling lipSync doubles it (a 9-second clip costs 18). width and height are required for both video and audio requests — omitting them returns a 500.",
      pathParams: [
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      queryParams: [
        {
          name: "mediaType",
          type: "string",
          required: true,
          description: "The type of media.",
          enum: ["video", "audio"],
        },
        {
          name: "lipSync",
          type: "boolean",
          required: true,
          description: "Whether lip sync is included.",
        },
        {
          name: "durationMs",
          type: "integer",
          required: true,
          description: "Media duration in milliseconds.",
        },
        {
          name: "width",
          type: "integer",
          required: true,
          description: "Video width in pixels.",
        },
        {
          name: "height",
          type: "integer",
          required: true,
          description: "Video height in pixels.",
        },
        {
          name: "targetLanguageSize",
          type: "integer",
          required: false,
          description: "Number of target languages.",
          default: "1",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "expectedUsedQuota": 10.0,
    "promotionExpectedUsedQuota": 10.0
  }
}`,
      },
    },
    {
      id: "get-user-queue",
      method: "PUT",
      path: "/video-translator/api/v1/projects/spaces/{spaceSeq}/queue",
      title: "Get User Queue",
      description:
        "Despite the name, calling this with PUT initializes (creates) the queue if it does not exist. Retrieve or initialize the queue for a user within a space. If no queue exists, a new one is automatically created and returned. This endpoint must be called before requesting a translation if the space does not yet have an initialized queue — otherwise the translation request will fail with a 'space queue not found' error. Both GET and PUT methods are supported. Internally, the service fetches the user's plan options from the Credit service, retrieves quota information, and looks up the TranslateQueue — creating a new one if it does not exist.",
      pathParams: [
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "userSeq": 19507,
    "planName": "pro",
    "usedQueueCount": 0,
    "maxQueueCount": 3,
    "redZoneQueueCount": 0
  }
}`,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Lip Sync API
// ---------------------------------------------------------------------------
export const lipSyncCategory: ApiCategory = {
  slug: "lip-sync",
  title: "Lip Sync API",
  description:
    "Request lip sync video generation and retrieve generation history.",
  endpoints: [
    {
      id: "request-lip-sync",
      method: "POST",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/lip-sync",
      title: "Request Lip Sync",
      description:
        "Submit a lip sync video generation request for a translated project.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      requestBody: {
        fields: [
          {
            name: "preferredSpeedType",
            type: "string",
            required: true,
            description: "Processing speed preference.",
            enum: ["GREEN", "RED"],
          },
          {
            name: "title",
            type: "string",
            required: false,
            description:
              "Project title. If omitted, the parent project title is used.",
          },
        ],
        example: `{
  "preferredSpeedType": "GREEN",
  "title": "My Lip Sync Project"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "startGenerateProjectIdList": [1, 2, 3]
  }
}`,
      },
    },
    {
      id: "lip-sync-history",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/lip-sync/generated",
      title: "Get Generation History",
      description:
        "Retrieve a paginated list of lip sync generation history for a project.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      queryParams: [
        {
          name: "page",
          type: "integer",
          required: false,
          description: "Page number.",
          default: "1",
        },
        {
          name: "pageSize",
          type: "integer",
          required: false,
          description: "Number of items per page.",
          default: "10",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "page": 1,
    "totalPages": 10,
    "hasNext": true,
    "contents": [
      {
        "type": "VIEW",
        "projectTitle": "Lip Sync Project 1",
        "lipSyncProjectSeq": 123,
        "status": "COMPLETED",
        "createDate": "2026-01-15T04:29:37.432Z"
      },
      {
        "type": "DOWNLOAD",
        "projectTitle": "Lip Sync Project 2",
        "exportZipDownloadPath": "/export.zip",
        "createDate": "2026-01-15T04:29:37.432Z"
      }
    ]
  }
}`,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Language API
// ---------------------------------------------------------------------------
export const languageCategory: ApiCategory = {
  slug: "language",
  title: "Language API",
  description:
    "Retrieve the list of languages available for dubbing and translation.",
  endpoints: [
    {
      id: "get-languages",
      method: "GET",
      path: "/video-translator/api/v1/languages",
      title: "List Languages",
      description:
        "Returns a list of all supported languages including their language codes, names, and the TTS models each language supports. This endpoint is the only way to check TTS model support — there is no dedicated model-lookup endpoint. `supportedTtsModels` lists the valid TTS models when the language is used as a translation target; use it to validate `ttsModel` before submitting a translation (an unsupported pair returns 400 VT4009). The same `code` can appear multiple times, distinguished by `languageTag` (e.g. English (US) has `languageTag: \"default\"` while English (UK) has `languageTag: \"en-GB\"`; likewise pt-PT, es-ES). `code: \"auto\"` (Auto Detect) is for `sourceLanguageCode` only — it has an empty `supportedTtsModels` and cannot be a target. Experimental languages are flagged via `experiment`.",
      response: {
        statusCode: 200,
        example: `{
  "languages": [
    {
      "code": "auto",
      "name": "Auto Detect",
      "languageTag": "default",
      "experiment": false,
      "supportedTtsModels": []
    },
    {
      "code": "en",
      "name": "English (US)",
      "languageTag": "default",
      "experiment": false,
      "supportedTtsModels": ["AUDIO_ENGINE_V3", "ELEVEN_V2", "ELEVEN_V3"]
    },
    {
      "code": "en",
      "name": "English (UK)",
      "languageTag": "en-GB",
      "experiment": false,
      "supportedTtsModels": ["AUDIO_ENGINE_V3", "ELEVEN_V3"]
    },
    {
      "code": "ja",
      "name": "Japanese",
      "languageTag": "default",
      "experiment": false,
      "supportedTtsModels": ["AUDIO_ENGINE_V3", "ELEVEN_V3"]
    }
  ]
}`,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Feedback API
// ---------------------------------------------------------------------------
export const feedbackCategory: ApiCategory = {
  slug: "feedback",
  title: "Feedback API",
  description: "Submit and retrieve feedback ratings for translated projects.",
  endpoints: [
    {
      id: "submit-feedback",
      method: "POST",
      path: "/video-translator/api/v1/projects/feedbacks",
      title: "Submit Feedback",
      description:
        "Submit a feedback rating for a specific project. Ratings must be between 1 and 5.",
      requestBody: {
        fields: [
          {
            name: "projectSeq",
            type: "integer",
            required: true,
            description: "The unique identifier of the project.",
          },
          {
            name: "rating",
            type: "integer",
            required: true,
            description: "Feedback score from 1 to 5.",
          },
        ],
        example: `{
  "projectSeq": 101,
  "rating": 4
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "averageRating": 4.5,
  "count": 10
}`,
      },
      errors: [
        { code: "VT4041", status: 404, description: "Project not found" },
        {
          code: "VT4045",
          status: 404,
          description: "Project has been deleted",
        },
      ],
    },
    {
      id: "get-feedback",
      method: "GET",
      path: "/video-translator/api/v1/projects/feedbacks",
      title: "Get Feedback",
      description:
        "Retrieve the feedback rating you submitted for a specific project. Returns 204 No Content if no feedback has been submitted.",
      queryParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "rating": 4
}`,
      },
      errors: [
        { code: "VT4041", status: 404, description: "Project not found" },
        {
          code: "VT4045",
          status: 404,
          description: "Project has been deleted",
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Community Spotlight API
// ---------------------------------------------------------------------------
export const communitySpotlightCategory: ApiCategory = {
  slug: "community-spotlight",
  title: "Community Spotlight API",
  description: "Browse featured public projects and shared translations.",
  endpoints: [
    {
      id: "list-recommended",
      method: "GET",
      path: "/video-translator/api/v1/projects/recommended",
      title: "List Featured Projects",
      description:
        "Retrieve a paginated list of projects featured in the Community Spotlight. This is a public endpoint — no XP-API-KEY is required.",
      queryParams: [
        {
          name: "page",
          type: "integer",
          required: false,
          description: "Page number (zero-based).",
          default: "0",
        },
        {
          name: "size",
          type: "integer",
          required: false,
          description: "Number of items per page.",
        },
        {
          name: "languageCode",
          type: "string",
          required: false,
          description: "Filter by source language code (e.g. ko, en, ja).",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "totalCount": 100,
  "totalPages": 10,
  "page": 1,
  "size": 10,
  "isLast": false,
  "contents": [
    {
      "seq": 1,
      "title": "How to build with Framer",
      "mediaType": "VIDEO",
      "userName": "oh****on",
      "thumbnailUrl": "/thumbnail.jpg",
      "durationMs": 10000,
      "sourceLanguage": {
        "code": "en",
        "name": "English"
      },
      "targetLanguage": {
        "code": "ko",
        "name": "Korean"
      },
      "isLipSync": true,
      "feedbackAverage": {
        "averageRating": 4.5,
        "count": 10
      }
    }
  ]
}`,
      },
    },
    {
      id: "get-recommended",
      method: "GET",
      path: "/video-translator/api/v1/projects/recommended/{projectSeq}",
      title: "Get Featured Project",
      description:
        "Retrieve detailed information about a specific featured project. This is a public endpoint — no XP-API-KEY is required. The response is not wrapped in a result object. File URLs are relative /perso-storage/... paths (prepend https://portal-media.perso.ai).",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "seq": 1,
  "title": "How to build with Framer",
  "mediaType": "VIDEO",
  "userName": "oh****on",
  "thumbnailUrl": "/thumbnail.jpg",
  "durationMs": 10000,
  "sourceLanguage": {
    "code": "en",
    "name": "English (US)",
    "languageTag": "default",
    "experiment": false,
    "supportedTtsModels": ["AUDIO_ENGINE_V3", "ELEVEN_V2", "ELEVEN_V3"]
  },
  "targetLanguage": {
    "code": "ko",
    "name": "Korean",
    "languageTag": "default",
    "experiment": false,
    "supportedTtsModels": ["AUDIO_ENGINE_V3", "ELEVEN_V2", "ELEVEN_V3"]
  },
  "originalFileUrl": "/original.mp4",
  "translatedFileUrl": "/translated.mp4",
  "lipSyncFileUrl": "/lip-sync.mp4",
  "subtitleFileUrl": "/subtitle.srt",
  "isLipSync": true,
  "feedbackAverage": {
    "averageRating": 4.5,
    "count": 10
  },
  "createDate": "2026-01-15T10:00:00Z",
  "updateDate": "2026-01-15T11:00:00Z"
}`,
      },
      errors: [
        { code: "VT4041", status: 404, description: "Project not found" },
      ],
    },
    {
      id: "get-shared",
      method: "GET",
      path: "/video-translator/api/v1/projects/shared/{sharedQuery}",
      title: "Get Shared Project",
      description:
        "Retrieve project information using an encrypted share query string. This is a public endpoint — no XP-API-KEY is required. The response is not wrapped in a result object. File URLs are relative /perso-storage/... paths (prepend https://portal-media.perso.ai).",
      pathParams: [
        {
          name: "sharedQuery",
          type: "string",
          required: true,
          description: "Encrypted share query string.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "seq": 1,
  "title": "How to build with Framer",
  "projectType": "VIDEO",
  "userName": "oh****on",
  "durationMs": 10000,
  "sourceLanguage": {
    "code": "en",
    "name": "English (US)",
    "languageTag": "default",
    "experiment": false,
    "supportedTtsModels": ["AUDIO_ENGINE_V3", "ELEVEN_V2", "ELEVEN_V3"]
  },
  "targetLanguage": {
    "code": "ko",
    "name": "Korean",
    "languageTag": "default",
    "experiment": false,
    "supportedTtsModels": ["AUDIO_ENGINE_V3", "ELEVEN_V2", "ELEVEN_V3"]
  },
  "originalFileUrl": "/original.mp4",
  "translatedFileUrl": "/translated.mp4",
  "isLipSync": true
}`,
      },
      errors: [
        {
          code: "VT4035",
          status: 403,
          description:
            "Sharing is disabled for this project (SHARED_NOT_ACCESSIBLE)",
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// STT API
// ---------------------------------------------------------------------------
export const sttCategory: ApiCategory = {
  slug: "stt",
  title: "STT API",
  description:
    "Create Speech-to-Text projects and retrieve generated STT scripts.",
  endpoints: [
    {
      id: "create-stt",
      method: "POST",
      path: "/video-translator/api/v1/projects/spaces/{spaceSeq}/stt",
      title: "Create STT Project",
      description:
        "Create a Speech-to-Text (STT) project from an uploaded media file. The mediaSeq is the seq value returned from the Upload Video or Upload Audio endpoint in the File API. " +
        "If you receive a 'space queue not found' error, first call PUT /video-translator/api/v1/projects/spaces/{spaceSeq}/queue (Usage API) to initialize the queue, then retry.",
      pathParams: [
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      requestBody: {
        fields: [
          {
            name: "mediaSeq",
            type: "integer",
            required: true,
            description:
              "The media sequence (seq) returned from the Upload Video or Upload Audio API response.",
          },
          {
            name: "isVideoProject",
            type: "boolean",
            required: true,
            description:
              "Whether this is a video project (true) or audio project (false).",
          },
          {
            name: "title",
            type: "string",
            required: false,
            description:
              "Project title. If omitted, the media file name is used.",
          },
        ],
        example: `{
  "mediaSeq": 12345,
  "isVideoProject": true,
  "title": "My STT Project"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "startGenerateProjectIdList": [101]
  }
}`,
      },
    },
    {
      id: "regenerate-stt",
      method: "POST",
      path: "/video-translator/api/v1/project/{projectSeq}/space/{spaceSeq}/stt/apply-changes",
      title: "Regenerate STT",
      description:
        "Request regeneration of the STT (Speech-to-Text) results for a project after applying script edits.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "result": null
}`,
      },
    },
    {
      id: "get-stt-script",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/stt/script",
      title: "Get STT Project Script",
      description:
        "Retrieve the script for a completed STT project. Uses cursor-based pagination — omit cursorId on the first request. Each sentence's originalDraftText may be null; use originalText for the transcribed content. Each speaker's voiceId carries the same pvtv- identifier as externalSpeakerSeq.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      queryParams: [
        {
          name: "cursorId",
          type: "integer",
          required: false,
          description:
            "Cursor-based pagination ID. Omit on the first request; pass the last item's cursor value on subsequent requests.",
        },
        {
          name: "size",
          type: "integer",
          required: false,
          default: "10000",
          description: "Page size.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "hasNext": true,
  "nextCursorId": 123456789,
  "sentences": [
    {
      "seq": 1,
      "externalScriptSeq": "pvtv-e1045225d769af98305367b722c1adfb",
      "speakerOrderIndex": 1,
      "offsetMs": 0,
      "durationMs": 1000,
      "originalDraftText": null,
      "originalText": "Hello, world!"
    }
  ],
  "speakers": [
    {
      "speakerOrderIndex": 1,
      "externalSpeakerSeq": "pvtv-e1045225d769af98305367b722c1adfb",
      "voiceId": "pvtv-e1045225d769af98305367b722c1adfb",
      "speakerSeq": 1,
      "speakerName": "Speaker 1"
    }
  ]
}`,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Audio Separation API
// ---------------------------------------------------------------------------
export const audioSeparationCategory: ApiCategory = {
  slug: "audio-separation",
  title: "Audio Separation API",
  description:
    "Create Audio Separation projects that split media into voice and background audio tracks, and retrieve the generated script.",
  endpoints: [
    {
      id: "create-audio-separation",
      method: "POST",
      path: "/video-translator/api/v1/projects/spaces/{spaceSeq}/audio-separation",
      title: "Create Audio Separation Project",
      description:
        "Create an Audio Separation project that splits a media file into voice and background audio tracks. " +
        "If you receive a 'space queue not found' error, first call PUT /video-translator/api/v1/projects/spaces/{spaceSeq}/queue (Usage API) to initialize the queue, then retry.",
      pathParams: [
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      requestBody: {
        fields: [
          {
            name: "mediaSeq",
            type: "integer",
            required: true,
            description:
              "The media sequence (seq) returned from the Upload Video or Upload Audio API response.",
          },
          {
            name: "isVideoProject",
            type: "boolean",
            required: true,
            description:
              "Whether this is a video project (true) or audio project (false).",
          },
          {
            name: "title",
            type: "string",
            required: false,
            description:
              "Project title. If omitted, the media file name is used.",
          },
        ],
        example: `{
  "mediaSeq": 12345,
  "isVideoProject": false,
  "title": "My Audio Separation Project"
}`,
      },
      response: {
        statusCode: 200,
        example: `{
  "result": {
    "startGenerateProjectIdList": [102]
  }
}`,
      },
    },
    {
      id: "get-audio-separation-script",
      method: "GET",
      path: "/video-translator/api/v1/projects/{projectSeq}/spaces/{spaceSeq}/audio-separation/script",
      title: "Get Audio Separation Project Script",
      description:
        "Retrieve the script for a completed Audio Separation project. Uses cursor-based pagination — omit cursorId on the first request. Each sentence's originalDraftText may be null; use originalText for the transcribed content. Each speaker's voiceId carries the same pvtv- identifier as externalSpeakerSeq.",
      pathParams: [
        {
          name: "projectSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the project.",
        },
        {
          name: "spaceSeq",
          type: "integer",
          required: true,
          description: "The unique identifier of the space.",
        },
      ],
      queryParams: [
        {
          name: "cursorId",
          type: "integer",
          required: false,
          description:
            "Cursor-based pagination ID. Omit on the first request; pass the last item's cursor value on subsequent requests.",
        },
        {
          name: "size",
          type: "integer",
          required: false,
          default: "10000",
          description: "Page size.",
        },
      ],
      response: {
        statusCode: 200,
        example: `{
  "hasNext": true,
  "nextCursorId": 123456789,
  "sentences": [
    {
      "seq": 1,
      "externalScriptSeq": "pvtv-e1045225d769af98305367b722c1adfb",
      "speakerOrderIndex": 1,
      "offsetMs": 0,
      "durationMs": 1000,
      "originalDraftText": null,
      "originalText": "Hello, world!",
      "audioUrl": "/perso-storage/audio.mp3"
    }
  ],
  "speakers": [
    {
      "speakerOrderIndex": 1,
      "externalSpeakerSeq": "pvtv-e1045225d769af98305367b722c1adfb",
      "voiceId": "pvtv-e1045225d769af98305367b722c1adfb",
      "speakerSeq": 1,
      "speakerName": "Speaker 1"
    }
  ]
}`,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Combined categories map
// ---------------------------------------------------------------------------
export const apiDocsCategories: Record<string, ApiCategory> = {
  space: spaceCategory,
  file: fileCategory,
  dubbing: dubbingCategory,
  editing: editingCategory,
  usage: usageCategory,
  "lip-sync": lipSyncCategory,
  stt: sttCategory,
  "audio-separation": audioSeparationCategory,
  language: languageCategory,
  feedback: feedbackCategory,
  "community-spotlight": communitySpotlightCategory,
};
