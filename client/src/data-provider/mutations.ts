import {
  EToolResources,
  LocalStorageKeys,
  InfiniteCollections,
  defaultAssistantsVersion,
  ConversationListResponse,
} from 'librechat-data-provider';
import { useSetRecoilState } from 'recoil';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService, MutationKeys, QueryKeys, defaultOrderQuery } from 'librechat-data-provider';
import type t from 'librechat-data-provider';
import type { InfiniteData, UseMutationResult } from '@tanstack/react-query';
import { updateConversationTag } from '~/utils/conversationTags';
import { normalizeData } from '~/utils/collection';
import store from '~/store';
import {
  useConversationTagsQuery,
  useConversationsInfiniteQuery,
  useSharedLinksInfiniteQuery,
} from './queries';
import {
  /* Shared Links */
  addSharedLink,
  deleteSharedLink,
  /* Conversations */
  addConversation,
  updateConvoFields,
  updateConversation,
  deleteConversation,
} from '~/utils';

export type TGenTitleMutation = UseMutationResult<
  t.TGenTitleResponse,
  unknown,
  t.TGenTitleRequest,
  unknown
>;

/** Conversations */
export const useGenTitleMutation = (): TGenTitleMutation => {
  const queryClient = useQueryClient();
  return useMutation((payload: t.TGenTitleRequest) => dataService.genTitle(payload), {
    onSuccess: (response, vars) => {
      queryClient.setQueryData(
        [QueryKeys.conversation, vars.conversationId],
        (convo: t.TConversation | undefined) => {
          if (!convo) {
            return convo;
          }
          return { ...convo, title: response.title };
        },
      );
      queryClient.setQueryData<t.ConversationData>([QueryKeys.allConversations], (convoData) => {
        if (!convoData) {
          return convoData;
        }
        return updateConvoFields(convoData, {
          conversationId: vars.conversationId,
          title: response.title,
        } as t.TConversation);
      });
      document.title = response.title;
    },
  });
};

export const useUpdateConversationMutation = (
  id: string,
): UseMutationResult<
  t.TUpdateConversationResponse,
  unknown,
  t.TUpdateConversationRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation(
    (payload: t.TUpdateConversationRequest) => dataService.updateConversation(payload),
    {
      onSuccess: (updatedConvo) => {
        queryClient.setQueryData([QueryKeys.conversation, id], updatedConvo);
        queryClient.setQueryData<t.ConversationData>([QueryKeys.allConversations], (convoData) => {
          if (!convoData) {
            return convoData;
          }
          return updateConversation(convoData, updatedConvo);
        });
      },
    },
  );
};

const useUpdateTagsInConversation = () => {
  const queryClient = useQueryClient();

  // Update the queryClient cache with the new tag when a new tag is added/removed to a conversation
  const updateTagsInConversation = (conversationId: string, tags: string[]) => {
    // Update the tags for the current conversation
    const currentConvo = queryClient.getQueryData<t.TConversation>([
      QueryKeys.conversation,
      conversationId,
    ]);
    if (!currentConvo) {
      return;
    }

    const updatedConvo = {
      ...currentConvo,
      tags,
    } as t.TConversation;
    queryClient.setQueryData([QueryKeys.conversation, conversationId], updatedConvo);
    queryClient.setQueryData<t.ConversationData>([QueryKeys.allConversations], (convoData) => {
      if (!convoData) {
        return convoData;
      }
      return updateConvoFields(
        convoData,
        {
          conversationId: currentConvo.conversationId,
          tags: updatedConvo.tags,
        } as t.TConversation,
        true,
      );
    });
  };

  // update the tag to newTag in all conversations when a tag is updated to a newTag
  // The difference with updateTagsInConversation is that it adds or removes tags for a specific conversation,
  // whereas this function is for changing the title of a specific tag.
  const replaceTagsInAllConversations = (tag: string, newTag: string) => {
    const data = queryClient.getQueryData<InfiniteData<ConversationListResponse>>([
      QueryKeys.allConversations,
    ]);

    const conversationIdsWithTag = [] as string[];

    // update tag to newTag in all conversations
    const newData = JSON.parse(JSON.stringify(data)) as InfiniteData<ConversationListResponse>;
    for (let pageIndex = 0; pageIndex < newData.pages.length; pageIndex++) {
      const page = newData.pages[pageIndex];
      page.conversations = page.conversations.map((conversation) => {
        if (conversation.conversationId && conversation.tags?.includes(tag)) {
          conversationIdsWithTag.push(conversation.conversationId);
          conversation.tags = conversation.tags.map((t) => (t === tag ? newTag : t));
        }
        return conversation;
      });
    }
    queryClient.setQueryData<InfiniteData<ConversationListResponse>>(
      [QueryKeys.allConversations],
      newData,
    );

    // update the tag to newTag from the cache of each conversation
    for (let i = 0; i < conversationIdsWithTag.length; i++) {
      const conversationId = conversationIdsWithTag[i];
      const conversation = queryClient.getQueryData<t.TConversation>([
        QueryKeys.conversation,
        conversationId,
      ]);
      if (conversation && conversation.tags) {
        const updatedConvo = {
          ...conversation,
          tags: conversation.tags.map((t) => (t === tag ? newTag : t)),
        } as t.TConversation;
        queryClient.setQueryData<t.TConversation>(
          [QueryKeys.conversation, conversationId],
          updatedConvo,
        );
      }
    }
  };

  return { updateTagsInConversation, replaceTagsInAllConversations };
};
/**
 * Add or remove tags for a conversation
 */
export const useTagConversationMutation = (
  conversationId: string,
): UseMutationResult<t.TTagConversationResponse, unknown, t.TTagConversationRequest, unknown> => {
  const query = useConversationTagsQuery();
  const { updateTagsInConversation } = useUpdateTagsInConversation();
  return useMutation(
    (payload: t.TTagConversationRequest) =>
      dataService.addTagToConversation(conversationId, payload),
    {
      onSuccess: (updatedTags) => {
        // Because the logic for calculating the bookmark count is complex,
        // the client does not perform the calculation,
        // but instead refetch the data from the API.
        query.refetch();
        updateTagsInConversation(conversationId, updatedTags);
      },
    },
  );
};

export const useArchiveConversationMutation = (
  id: string,
): UseMutationResult<
  t.TArchiveConversationResponse,
  unknown,
  t.TArchiveConversationRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  const { refetch } = useConversationsInfiniteQuery();
  const { refetch: archiveRefetch } = useConversationsInfiniteQuery({
    pageNumber: '1', // dummy value not used to refetch
    isArchived: true,
  });
  return useMutation(
    (payload: t.TArchiveConversationRequest) => dataService.archiveConversation(payload),
    {
      onSuccess: (_data, vars) => {
        if (vars.isArchived) {
          queryClient.setQueryData([QueryKeys.conversation, id], null);
        } else {
          queryClient.setQueryData([QueryKeys.conversation, id], _data);
        }

        queryClient.setQueryData<t.ConversationData>([QueryKeys.allConversations], (convoData) => {
          if (!convoData) {
            return convoData;
          }
          const pageSize = convoData.pages[0].pageSize as number;

          return normalizeData(
            vars.isArchived ? deleteConversation(convoData, id) : addConversation(convoData, _data),
            'conversations',
            pageSize,
          );
        });

        if (vars.isArchived) {
          const current = queryClient.getQueryData<t.ConversationData>([
            QueryKeys.allConversations,
          ]);
          refetch({ refetchPage: (page, index) => index === (current?.pages.length || 1) - 1 });
        }

        queryClient.setQueryData<t.ConversationData>(
          [QueryKeys.archivedConversations],
          (convoData) => {
            if (!convoData) {
              return convoData;
            }
            const pageSize = convoData.pages[0].pageSize as number;
            return normalizeData(
              vars.isArchived
                ? addConversation(convoData, _data)
                : deleteConversation(convoData, id),
              'conversations',
              pageSize,
            );
          },
        );

        if (!vars.isArchived) {
          const currentArchive = queryClient.getQueryData<t.ConversationData>([
            QueryKeys.archivedConversations,
          ]);
          archiveRefetch({
            refetchPage: (page, index) => index === (currentArchive?.pages.length || 1) - 1,
          });
        }
      },
    },
  );
};

export const useCreateSharedLinkMutation = (
  options?: t.CreateSharedLinkOptions,
): UseMutationResult<t.TSharedLinkResponse, unknown, t.TSharedLinkRequest, unknown> => {
  const queryClient = useQueryClient();
  const { refetch } = useSharedLinksInfiniteQuery();
  const { onSuccess, ..._options } = options || {};
  return useMutation((payload: t.TSharedLinkRequest) => dataService.createSharedLink(payload), {
    onSuccess: (_data, vars, context) => {
      if (!vars.conversationId) {
        return;
      }

      queryClient.setQueryData<t.SharedLinkListData>([QueryKeys.sharedLinks], (sharedLink) => {
        if (!sharedLink) {
          return sharedLink;
        }
        const pageSize = sharedLink.pages[0].pageSize as number;
        return normalizeData(
          // If the shared link is public, add it to the shared links cache list
          vars.isPublic
            ? addSharedLink(sharedLink, _data)
            : deleteSharedLink(sharedLink, _data.shareId),
          InfiniteCollections.SHARED_LINKS,
          pageSize,
        );
      });

      queryClient.setQueryData([QueryKeys.sharedLinks, _data.shareId], _data);
      if (!vars.isPublic) {
        const current = queryClient.getQueryData<t.ConversationData>([QueryKeys.sharedLinks]);
        refetch({
          refetchPage: (page, index) => index === (current?.pages.length || 1) - 1,
        });
      }
      onSuccess?.(_data, vars, context);
    },
    ...(_options || {}),
  });
};

export const useUpdateSharedLinkMutation = (
  options?: t.UpdateSharedLinkOptions,
): UseMutationResult<t.TSharedLinkResponse, unknown, t.TSharedLinkRequest, unknown> => {
  const queryClient = useQueryClient();
  const { refetch } = useSharedLinksInfiniteQuery();
  const { onSuccess, ..._options } = options || {};
  return useMutation((payload: t.TSharedLinkRequest) => dataService.updateSharedLink(payload), {
    onSuccess: (_data, vars, context) => {
      if (!vars.conversationId) {
        return;
      }

      queryClient.setQueryData<t.SharedLinkListData>([QueryKeys.sharedLinks], (sharedLink) => {
        if (!sharedLink) {
          return sharedLink;
        }

        return normalizeData(
          // If the shared link is public, add it to the shared links cache list.
          vars.isPublic
            ? // Even if the SharedLink data exists in the database, it is not registered in the cache when isPublic is false.
          // Therefore, when isPublic is true, use addSharedLink instead of updateSharedLink.
            addSharedLink(sharedLink, _data)
            : deleteSharedLink(sharedLink, _data.shareId),
          InfiniteCollections.SHARED_LINKS,
          sharedLink.pages[0].pageSize as number,
        );
      });

      queryClient.setQueryData([QueryKeys.sharedLinks, _data.shareId], _data);
      if (!vars.isPublic) {
        const current = queryClient.getQueryData<t.ConversationData>([QueryKeys.sharedLinks]);
        refetch({
          refetchPage: (page, index) => index === (current?.pages.length || 1) - 1,
        });
      }

      onSuccess?.(_data, vars, context);
    },
    ...(_options || {}),
  });
};

export const useDeleteSharedLinkMutation = (
  options?: t.DeleteSharedLinkOptions,
): UseMutationResult<t.TDeleteSharedLinkResponse, unknown, { shareId: string }, unknown> => {
  const queryClient = useQueryClient();
  const { refetch } = useSharedLinksInfiniteQuery();
  const { onSuccess, ..._options } = options || {};
  return useMutation(({ shareId }) => dataService.deleteSharedLink(shareId), {
    onSuccess: (_data, vars, context) => {
      if (!vars.shareId) {
        return;
      }

      queryClient.setQueryData([QueryKeys.sharedMessages, vars.shareId], null);
      queryClient.setQueryData<t.SharedLinkListData>([QueryKeys.sharedLinks], (data) => {
        if (!data) {
          return data;
        }
        return normalizeData(
          deleteSharedLink(data, vars.shareId),
          InfiniteCollections.SHARED_LINKS,
          data.pages[0].pageSize as number,
        );
      });
      const current = queryClient.getQueryData<t.ConversationData>([QueryKeys.sharedLinks]);
      refetch({
        refetchPage: (page, index) => index === (current?.pages.length || 1) - 1,
      });
      onSuccess?.(_data, vars, context);
    },
    ...(_options || {}),
  });
};

// If the number of conversations tagged is incorrect, recalculate the tag information.
export const useRebuildConversationTagsMutation = (): UseMutationResult<
  t.TConversationTagsResponse,
  unknown,
  unknown,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation(() => dataService.rebuildConversationTags(), {
    onSuccess: (_data) => {
      queryClient.setQueryData<t.TConversationTag[]>([QueryKeys.conversationTags], _data);
    },
  });
};

// Add a tag or update tag information (tag, description, position, etc.)
export const useConversationTagMutation = (
  tag?: string,
  options?: t.UpdateConversationTagOptions,
): UseMutationResult<t.TConversationTagResponse, unknown, t.TConversationTagRequest, unknown> => {
  const queryClient = useQueryClient();
  const { ..._options } = options || {};
  const { updateTagsInConversation, replaceTagsInAllConversations } = useUpdateTagsInConversation();
  return useMutation(
    (payload: t.TConversationTagRequest) =>
      tag
        ? dataService.updateConversationTag(tag, payload)
        : dataService.createConversationTag(payload),
    {
      onSuccess: (_data, vars) => {
        queryClient.setQueryData<t.TConversationTag[]>([QueryKeys.conversationTags], (data) => {
          if (!data) {
            return [
              {
                tag: 'Saved',
                count: 1,
                position: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ] as t.TConversationTag[];
          }
          return updateConversationTag(data, vars, _data, tag);
        });
        if (vars.addToConversation && vars.conversationId && _data.tag) {
          const currentConvo = queryClient.getQueryData<t.TConversation>([
            QueryKeys.conversation,
            vars.conversationId,
          ]);
          if (!currentConvo) {
            return;
          }
          updateTagsInConversation(vars.conversationId, [...(currentConvo.tags || []), _data.tag]);
        }
        // Change the tag title to the new title
        if (tag) {
          replaceTagsInAllConversations(tag, _data.tag);
        }
      },
      ...(_options || {}),
    },
  );
};

// When a bookmark is deleted, remove that bookmark(tag) from all conversations associated with it
export const useDeleteTagInConversations = () => {
  const queryClient = useQueryClient();
  const deleteTagInAllConversation = (deletedTag: string) => {
    const data = queryClient.getQueryData<InfiniteData<ConversationListResponse>>([
      QueryKeys.allConversations,
    ]);

    const conversationIdsWithTag = [] as string[];

    // remove deleted tag from conversations
    const newData = JSON.parse(JSON.stringify(data)) as InfiniteData<ConversationListResponse>;
    for (let pageIndex = 0; pageIndex < newData.pages.length; pageIndex++) {
      const page = newData.pages[pageIndex];
      page.conversations = page.conversations.map((conversation) => {
        if (conversation.conversationId && conversation.tags?.includes(deletedTag)) {
          conversationIdsWithTag.push(conversation.conversationId);
          conversation.tags = conversation.tags.filter((t) => t !== deletedTag);
        }
        return conversation;
      });
    }
    queryClient.setQueryData<InfiniteData<ConversationListResponse>>(
      [QueryKeys.allConversations],
      newData,
    );

    // Remove the deleted tag from the cache of each conversation
    for (let i = 0; i < conversationIdsWithTag.length; i++) {
      const conversationId = conversationIdsWithTag[i];
      const conversationData = queryClient.getQueryData<t.TConversation>([
        QueryKeys.conversation,
        conversationId,
      ]);
      if (conversationData && conversationData.tags) {
        conversationData.tags = conversationData.tags.filter((t) => t !== deletedTag);
        queryClient.setQueryData<t.TConversation>(
          [QueryKeys.conversation, conversationId],
          conversationData,
        );
      }
    }
  };
  return deleteTagInAllConversation;
};
// Delete a tag
export const useDeleteConversationTagMutation = (
  options?: t.DeleteConversationTagOptions,
): UseMutationResult<t.TConversationTagResponse, unknown, string, void> => {
  const queryClient = useQueryClient();
  const deleteTagInAllConversations = useDeleteTagInConversations();
  const { onSuccess, ..._options } = options || {};
  return useMutation((tag: string) => dataService.deleteConversationTag(tag), {
    onSuccess: (_data, vars, context) => {
      queryClient.setQueryData<t.TConversationTag[]>([QueryKeys.conversationTags], (data) => {
        if (!data) {
          return data;
        }
        return data.filter((t) => t.tag !== vars);
      });

      deleteTagInAllConversations(vars);
      onSuccess?.(_data, vars, context);
    },
    ...(_options || {}),
  });
};

export const useDeleteConversationMutation = (
  options?: t.DeleteConversationOptions,
): UseMutationResult<
  t.TDeleteConversationResponse,
  unknown,
  t.TDeleteConversationRequest,
  unknown
> => {
  const queryClient = useQueryClient();
  const { refetch } = useConversationsInfiniteQuery();
  const { onSuccess, ..._options } = options || {};
  return useMutation(
    (payload: t.TDeleteConversationRequest) => dataService.deleteConversation(payload),
    {
      onSuccess: (_data, vars, context) => {
        if (!vars.conversationId) {
          return;
        }

        const handleDelete = (convoData) => {
          if (!convoData) {
            return convoData;
          }
          return normalizeData(
            deleteConversation(convoData, vars.conversationId as string),
            'conversations',
            convoData.pages[0].pageSize,
          );
        };

        queryClient.setQueryData([QueryKeys.conversation, vars.conversationId], null);
        queryClient.setQueryData<t.ConversationData>([QueryKeys.allConversations], handleDelete);
        queryClient.setQueryData<t.ConversationData>(
          [QueryKeys.archivedConversations],
          handleDelete,
        );
        const current = queryClient.getQueryData<t.ConversationData>([QueryKeys.allConversations]);
        refetch({ refetchPage: (page, index) => index === (current?.pages.length || 1) - 1 });
        onSuccess?.(_data, vars, context);
      },
      ...(_options || {}),
    },
  );
};

export const useForkConvoMutation = (
  options?: t.ForkConvoOptions,
): UseMutationResult<t.TForkConvoResponse, unknown, t.TForkConvoRequest, unknown> => {
  const queryClient = useQueryClient();
  const { onSuccess, ..._options } = options || {};
  return useMutation((payload: t.TForkConvoRequest) => dataService.forkConversation(payload), {
    onSuccess: (data, vars, context) => {
      if (!vars.conversationId) {
        return;
      }
      queryClient.setQueryData(
        [QueryKeys.conversation, data.conversation.conversationId],
        data.conversation,
      );
      queryClient.setQueryData<t.ConversationData>([QueryKeys.allConversations], (convoData) => {
        if (!convoData) {
          return convoData;
        }
        return addConversation(convoData, data.conversation);
      });
      queryClient.setQueryData<t.TMessage[]>(
        [QueryKeys.messages, data.conversation.conversationId],
        data.messages,
      );
      onSuccess?.(data, vars, context);
    },
    ...(_options || {}),
  });
};

export const useUploadConversationsMutation = (
  _options?: t.MutationOptions<t.TImportResponse, FormData>,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, onMutate } = _options || {};

  return useMutation<t.TImportResponse, unknown, FormData>({
    mutationFn: (formData: FormData) => dataService.importConversationsFile(formData),
    onSuccess: (data, variables, context) => {
      /* TODO: optimize to return imported conversations and add manually */
      queryClient.invalidateQueries([QueryKeys.allConversations]);
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    onError: (err, variables, context) => {
      if (onError) {
        onError(err, variables, context);
      }
    },
    onMutate,
  });
};

export const useUploadFileMutation = (
  _options?: t.UploadMutationOptions,
): UseMutationResult<
  t.TFileUpload, // response data
  unknown, // error
  FormData, // request
  unknown // context
> => {
  const queryClient = useQueryClient();
  const { onSuccess, ...options } = _options || {};
  return useMutation([MutationKeys.fileUpload], {
    mutationFn: (body: FormData) => {
      const width = body.get('width');
      const height = body.get('height');
      const version = body.get('version') as number | string;
      if (height && width && (!version || version != 2)) {
        return dataService.uploadImage(body);
      }

      return dataService.uploadFile(body);
    },
    ...(options || {}),
    onSuccess: (data, formData, context) => {
      queryClient.setQueryData<t.TFile[] | undefined>([QueryKeys.files], (_files) => [
        data,
        ...(_files ?? []),
      ]);

      const endpoint = formData.get('endpoint');
      const assistant_id = formData.get('assistant_id');
      const message_file = formData.get('message_file');
      const tool_resource = formData.get('tool_resource');

      if (!assistant_id || message_file === 'true') {
        onSuccess?.(data, formData, context);
        return;
      }

      queryClient.setQueryData<t.AssistantListResponse>(
        [QueryKeys.assistants, endpoint, defaultOrderQuery],
        (prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            data: prev?.data.map((assistant) => {
              if (assistant.id !== assistant_id) {
                return assistant;
              }

              const update = {};
              if (!tool_resource) {
                update['file_ids'] = [...assistant.file_ids, data.file_id];
              }
              if (tool_resource === EToolResources.code_interpreter) {
                const prevResources = assistant.tool_resources ?? {};
                const prevResource = assistant.tool_resources?.[tool_resource as string] ?? {
                  file_ids: [],
                };
                prevResource.file_ids.push(data.file_id);
                update['tool_resources'] = {
                  ...prevResources,
                  [tool_resource as string]: prevResource,
                };
              }
              return {
                ...assistant,
                ...update,
              };
            }),
          };
        },
      );
      onSuccess?.(data, formData, context);
    },
  });
};

export const useDeleteFilesMutation = (
  _options?: t.DeleteMutationOptions,
): UseMutationResult<
  t.DeleteFilesResponse, // response data
  unknown, // error
  t.DeleteFilesBody, // request
  unknown // context
> => {
  const queryClient = useQueryClient();
  const { onSuccess, ...options } = _options || {};
  return useMutation([MutationKeys.fileDelete], {
    mutationFn: (body: t.DeleteFilesBody) =>
      dataService.deleteFiles(body.files, body.assistant_id, body.tool_resource),
    ...(options || {}),
    onSuccess: (data, ...args) => {
      queryClient.setQueryData<t.TFile[] | undefined>([QueryKeys.files], (cachefiles) => {
        const { files: filesDeleted } = args[0];

        const fileMap = filesDeleted.reduce((acc, file) => {
          acc.set(file.file_id, file);
          return acc;
        }, new Map<string, t.BatchFile>());

        return (cachefiles ?? []).filter((file) => !fileMap.has(file.file_id));
      });
      onSuccess?.(data, ...args);
    },
  });
};

export const useUpdatePresetMutation = (
  options?: t.UpdatePresetOptions,
): UseMutationResult<
  t.TPreset, // response data
  unknown,
  t.TPreset,
  unknown
> => {
  return useMutation([MutationKeys.updatePreset], {
    mutationFn: (preset: t.TPreset) => dataService.updatePreset(preset),
    ...(options || {}),
  });
};

export const useDeletePresetMutation = (
  options?: t.DeletePresetOptions,
): UseMutationResult<
  t.PresetDeleteResponse, // response data
  unknown,
  t.TPreset | undefined,
  unknown
> => {
  return useMutation([MutationKeys.deletePreset], {
    mutationFn: (preset: t.TPreset | undefined) => dataService.deletePreset(preset),
    ...(options || {}),
  });
};

/* login/logout */
export const useLogoutUserMutation = (
  options?: t.LogoutOptions,
): UseMutationResult<unknown, unknown, undefined, unknown> => {
  const queryClient = useQueryClient();
  const setDefaultPreset = useSetRecoilState(store.defaultPreset);
  return useMutation([MutationKeys.logoutUser], {
    mutationFn: () => dataService.logout(),

    ...(options || {}),
    onSuccess: (...args) => {
      options?.onSuccess?.(...args);
    },
    onMutate: (...args) => {
      setDefaultPreset(null);
      queryClient.removeQueries();
      localStorage.removeItem(LocalStorageKeys.LAST_CONVO_SETUP);
      localStorage.removeItem(`${LocalStorageKeys.LAST_CONVO_SETUP}_0`);
      localStorage.removeItem(`${LocalStorageKeys.LAST_CONVO_SETUP}_1`);
      localStorage.removeItem(LocalStorageKeys.LAST_MODEL);
      localStorage.removeItem(LocalStorageKeys.LAST_TOOLS);
      localStorage.removeItem(LocalStorageKeys.FILES_TO_DELETE);
      // localStorage.removeItem('lastAssistant');
      options?.onMutate?.(...args);
    },
  });
};

/* Avatar upload */
export const useUploadAvatarMutation = (
  options?: t.UploadAvatarOptions,
): UseMutationResult<
  t.AvatarUploadResponse, // response data
  unknown, // error
  FormData, // request
  unknown // context
> => {
  return useMutation([MutationKeys.avatarUpload], {
    mutationFn: (variables: FormData) => dataService.uploadAvatar(variables),
    ...(options || {}),
  });
};

export const useDeleteUserMutation = (
  options?: t.MutationOptions<unknown, undefined>,
): UseMutationResult<unknown, unknown, undefined, unknown> => {
  const queryClient = useQueryClient();
  const setDefaultPreset = useSetRecoilState(store.defaultPreset);
  return useMutation([MutationKeys.deleteUser], {
    mutationFn: () => dataService.deleteUser(),

    ...(options || {}),
    onSuccess: (...args) => {
      options?.onSuccess?.(...args);
    },
    onMutate: (...args) => {
      setDefaultPreset(null);
      queryClient.removeQueries();
      localStorage.removeItem(LocalStorageKeys.LAST_CONVO_SETUP);
      localStorage.removeItem(`${LocalStorageKeys.LAST_CONVO_SETUP}_0`);
      localStorage.removeItem(`${LocalStorageKeys.LAST_CONVO_SETUP}_1`);
      localStorage.removeItem(LocalStorageKeys.LAST_MODEL);
      localStorage.removeItem(LocalStorageKeys.LAST_TOOLS);
      localStorage.removeItem(LocalStorageKeys.FILES_TO_DELETE);
      options?.onMutate?.(...args);
    },
  });
};

/* Speech to text */
export const useSpeechToTextMutation = (
  options?: t.SpeechToTextOptions,
): UseMutationResult<
  t.SpeechToTextResponse, // response data
  unknown, // error
  FormData, // request
  unknown // context
> => {
  return useMutation([MutationKeys.speechToText], {
    mutationFn: (variables: FormData) => dataService.speechToText(variables),
    ...(options || {}),
  });
};

/* Text to speech */
export const useTextToSpeechMutation = (
  options?: t.TextToSpeechOptions,
): UseMutationResult<
  ArrayBuffer, // response data
  unknown, // error
  FormData, // request
  unknown // context
> => {
  return useMutation([MutationKeys.textToSpeech], {
    mutationFn: (variables: FormData) => dataService.textToSpeech(variables),
    ...(options || {}),
  });
};

/**
 * ASSISTANTS
 */

/**
 * Create a new assistant
 */
export const useCreateAssistantMutation = (
  options?: t.CreateAssistantMutationOptions,
): UseMutationResult<t.Assistant, Error, t.AssistantCreateParams> => {
  const queryClient = useQueryClient();
  return useMutation(
    (newAssistantData: t.AssistantCreateParams) => dataService.createAssistant(newAssistantData),
    {
      onMutate: (variables) => options?.onMutate?.(variables),
      onError: (error, variables, context) => options?.onError?.(error, variables, context),
      onSuccess: (newAssistant, variables, context) => {
        const listRes = queryClient.getQueryData<t.AssistantListResponse>([
          QueryKeys.assistants,
          variables.endpoint,
          defaultOrderQuery,
        ]);

        if (!listRes) {
          return options?.onSuccess?.(newAssistant, variables, context);
        }

        const currentAssistants = [newAssistant, ...JSON.parse(JSON.stringify(listRes.data))];

        queryClient.setQueryData<t.AssistantListResponse>(
          [QueryKeys.assistants, variables.endpoint, defaultOrderQuery],
          {
            ...listRes,
            data: currentAssistants,
          },
        );
        return options?.onSuccess?.(newAssistant, variables, context);
      },
    },
  );
};

/**
 * Hook for updating an assistant
 */
export const useUpdateAssistantMutation = (
  options?: t.UpdateAssistantMutationOptions,
): UseMutationResult<
  t.Assistant,
  Error,
  { assistant_id: string; data: t.AssistantUpdateParams }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ assistant_id, data }: { assistant_id: string; data: t.AssistantUpdateParams }) => {
      const { endpoint } = data;
      const endpointsConfig = queryClient.getQueryData<t.TEndpointsConfig>([QueryKeys.endpoints]);
      const version = endpointsConfig?.[endpoint]?.version ?? defaultAssistantsVersion[endpoint];
      return dataService.updateAssistant({
        data,
        version,
        assistant_id,
      });
    },
    {
      onMutate: (variables) => options?.onMutate?.(variables),
      onError: (error, variables, context) => options?.onError?.(error, variables, context),
      onSuccess: (updatedAssistant, variables, context) => {
        const listRes = queryClient.getQueryData<t.AssistantListResponse>([
          QueryKeys.assistants,
          variables.data.endpoint,
          defaultOrderQuery,
        ]);

        if (!listRes) {
          return options?.onSuccess?.(updatedAssistant, variables, context);
        }

        queryClient.setQueryData<t.AssistantListResponse>(
          [QueryKeys.assistants, variables.data.endpoint, defaultOrderQuery],
          {
            ...listRes,
            data: listRes.data.map((assistant) => {
              if (assistant.id === variables.assistant_id) {
                return updatedAssistant;
              }
              return assistant;
            }),
          },
        );
        return options?.onSuccess?.(updatedAssistant, variables, context);
      },
    },
  );
};

/**
 * Hook for deleting an assistant
 */
export const useDeleteAssistantMutation = (
  options?: t.DeleteAssistantMutationOptions,
): UseMutationResult<void, Error, t.DeleteAssistantBody> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ assistant_id, model, endpoint }: t.DeleteAssistantBody) => {
      const endpointsConfig = queryClient.getQueryData<t.TEndpointsConfig>([QueryKeys.endpoints]);
      const version = endpointsConfig?.[endpoint]?.version ?? defaultAssistantsVersion[endpoint];
      return dataService.deleteAssistant({ assistant_id, model, version, endpoint });
    },
    {
      onMutate: (variables) => options?.onMutate?.(variables),
      onError: (error, variables, context) => options?.onError?.(error, variables, context),
      onSuccess: (_data, variables, context) => {
        const listRes = queryClient.getQueryData<t.AssistantListResponse>([
          QueryKeys.assistants,
          variables.endpoint,
          defaultOrderQuery,
        ]);

        if (!listRes) {
          return options?.onSuccess?.(_data, variables, context);
        }

        const data = listRes.data.filter((assistant) => assistant.id !== variables.assistant_id);

        queryClient.setQueryData<t.AssistantListResponse>(
          [QueryKeys.assistants, variables.endpoint, defaultOrderQuery],
          {
            ...listRes,
            data,
          },
        );

        return options?.onSuccess?.(_data, variables, data);
      },
    },
  );
};

/**
 * Hook for uploading an assistant avatar
 */
export const useUploadAssistantAvatarMutation = (
  options?: t.UploadAssistantAvatarOptions,
): UseMutationResult<
  t.Assistant, // response data
  unknown, // error
  t.AssistantAvatarVariables, // request
  unknown // context
> => {
  return useMutation([MutationKeys.assistantAvatarUpload], {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: ({ postCreation, ...variables }: t.AssistantAvatarVariables) =>
      dataService.uploadAssistantAvatar(variables),
    ...(options || {}),
  });
};

/**
 * Hook for updating Assistant Actions
 */
export const useUpdateAction = (
  options?: t.UpdateActionOptions,
): UseMutationResult<
  t.UpdateActionResponse, // response data
  unknown, // error
  t.UpdateActionVariables, // request
  unknown // context
> => {
  const queryClient = useQueryClient();
  return useMutation([MutationKeys.updateAction], {
    mutationFn: (variables: t.UpdateActionVariables) => dataService.updateAction(variables),

    onMutate: (variables) => options?.onMutate?.(variables),
    onError: (error, variables, context) => options?.onError?.(error, variables, context),
    onSuccess: (updateActionResponse, variables, context) => {
      const listRes = queryClient.getQueryData<t.AssistantListResponse>([
        QueryKeys.assistants,
        variables.endpoint,
        defaultOrderQuery,
      ]);

      if (!listRes) {
        return options?.onSuccess?.(updateActionResponse, variables, context);
      }

      const updatedAssistant = updateActionResponse[1];

      queryClient.setQueryData<t.AssistantListResponse>(
        [QueryKeys.assistants, variables.endpoint, defaultOrderQuery],
        {
          ...listRes,
          data: listRes.data.map((assistant) => {
            if (assistant.id === variables.assistant_id) {
              return updatedAssistant;
            }
            return assistant;
          }),
        },
      );

      queryClient.setQueryData<t.Action[]>([QueryKeys.actions], (prev) => {
        return prev
          ?.map((action) => {
            if (action.action_id === variables.action_id) {
              return updateActionResponse[2];
            }
            return action;
          })
          .concat(variables.action_id ? [] : [updateActionResponse[2]]);
      });

      return options?.onSuccess?.(updateActionResponse, variables, context);
    },
  });
};

/**
 * Hook for deleting an Assistant Action
 */
export const useDeleteAction = (
  options?: t.DeleteActionOptions,
): UseMutationResult<
  void, // response data for a delete operation is typically void
  Error, // error type
  t.DeleteActionVariables, // request variables
  unknown // context
> => {
  const queryClient = useQueryClient();
  return useMutation([MutationKeys.deleteAction], {
    mutationFn: (variables: t.DeleteActionVariables) => {
      const { endpoint } = variables;
      const endpointsConfig = queryClient.getQueryData<t.TEndpointsConfig>([QueryKeys.endpoints]);
      const version = endpointsConfig?.[endpoint]?.version ?? defaultAssistantsVersion[endpoint];
      return dataService.deleteAction({
        ...variables,
        version,
      });
    },

    onMutate: (variables) => options?.onMutate?.(variables),
    onError: (error, variables, context) => options?.onError?.(error, variables, context),
    onSuccess: (_data, variables, context) => {
      let domain: string | undefined = '';
      queryClient.setQueryData<t.Action[]>([QueryKeys.actions], (prev) => {
        return prev?.filter((action) => {
          domain = action.metadata.domain;
          return action.action_id !== variables.action_id;
        });
      });

      queryClient.setQueryData<t.AssistantListResponse>(
        [QueryKeys.assistants, variables.endpoint, defaultOrderQuery],
        (prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            data: prev?.data.map((assistant) => {
              if (assistant.id === variables.assistant_id) {
                return {
                  ...assistant,
                  tools: assistant.tools.filter(
                    (tool) => !tool.function?.name.includes(domain ?? ''),
                  ),
                };
              }
              return assistant;
            }),
          };
        },
      );

      return options?.onSuccess?.(_data, variables, context);
    },
  });
};

/**
 * Hook for verifying email address
 */
export const useVerifyEmailMutation = (
  options?: t.VerifyEmailOptions,
): UseMutationResult<t.VerifyEmailResponse, unknown, t.TVerifyEmail, unknown> => {
  return useMutation({
    mutationFn: (variables: t.TVerifyEmail) => dataService.verifyEmail(variables),
    ...(options || {}),
  });
};

/**
 * Hook for resending verficiation email
 */
export const useResendVerificationEmail = (
  options?: t.ResendVerifcationOptions,
): UseMutationResult<t.VerifyEmailResponse, unknown, t.TResendVerificationEmail, unknown> => {
  return useMutation({
    mutationFn: (variables: t.TResendVerificationEmail) =>
      dataService.resendVerificationEmail(variables),
    ...(options || {}),
  });
};
