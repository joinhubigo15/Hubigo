import { request } from "@/app/lib/api";

export interface ConversationBusiness {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  sender: "CUSTOMER" | "BUSINESS";
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone: string | null;
  lastMessageAt: string;
  createdAt: string;
  messages: ConversationMessage[];
  business: ConversationBusiness;
}

export const getMyConversations = (accessToken: string) =>
  request<ConversationSummary[]>("/api/v1/users/me/conversations", { accessToken });

export const getMyConversationMessages = (accessToken: string, conversationId: string) =>
  request<{ conversation: ConversationSummary; messages: ConversationMessage[] }>(
    `/api/v1/users/me/conversations/${conversationId}`,
    { accessToken },
  );

export const sendMyConversationReply = (accessToken: string, conversationId: string, body: string) =>
  request<ConversationMessage>(`/api/v1/users/me/conversations/${conversationId}/messages`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ body }),
  });

export const deleteMyConversation = (accessToken: string, conversationId: string) =>
  request<null>(`/api/v1/users/me/conversations/${conversationId}`, { method: "DELETE", accessToken });
