import { Plus, EarthIcon } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { useGetStartupConfig } from 'librechat-data-provider/react-query';
import { Capabilities, defaultAgentFormValues } from 'librechat-data-provider';
import type { Agent, AgentCreateParams } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import type { UseFormReset } from 'react-hook-form';
import type { AgentCapabilities, AgentForm, TAgentOption } from '~/common';
import { cn, createDropdownSetter, createProviderOption, processAgentOption } from '~/utils';
import { useListAgentsQuery, useGetAgentByIdQuery } from '~/data-provider';
import SelectDropDown from '~/components/ui/SelectDropDown';
// import { useFileMapContext } from '~/Providers';
import { useLocalize } from '~/hooks';

const keys = new Set(Object.keys(defaultAgentFormValues));

export default function AgentSelect({
  reset,
  value: currentAgentValue,
  selectedAgentId = null,
  setCurrentAgentId,
  createMutation,
}: {
  reset: UseFormReset<AgentForm>;
  value?: TAgentOption;
  selectedAgentId: string | null;
  setCurrentAgentId: React.Dispatch<React.SetStateAction<string | undefined>>;
  createMutation: UseMutationResult<Agent, Error, AgentCreateParams>;
}) {
  const localize = useLocalize();
  // TODO: file handling for agents
  // const fileMap = useFileMapContext();
  const lastSelectedAgent = useRef<string | null>(null);

  const { data: startupConfig } = useGetStartupConfig();
  const { data: agents = null } = useListAgentsQuery(undefined, {
    select: (res) =>
      res.data.map((agent) =>
        processAgentOption({
          agent,
          instanceProjectId: startupConfig?.instanceProjectId,
          /* fileMap */
        }),
      ),
  });

  const agentQuery = useGetAgentByIdQuery(selectedAgentId ?? '', {
    enabled: !!(selectedAgentId ?? ''),
  });

  const resetAgentForm = useCallback(
    (fullAgent: Agent) => {
      const { instanceProjectId } = startupConfig ?? {};
      const isGlobal =
        (instanceProjectId != null && fullAgent.projectIds?.includes(instanceProjectId)) ?? false;
      const update = {
        ...fullAgent,
        provider: createProviderOption(fullAgent.provider),
        label: fullAgent.name ?? '',
        value: fullAgent.id || '',
        icon: isGlobal ? <EarthIcon className={'icon-lg text-green-400'} /> : null,
      };

      const actions: AgentCapabilities = {
        [Capabilities.code_interpreter]: false,
        [Capabilities.image_vision]: false,
        [Capabilities.retrieval]: false,
      };

      const formValues: Partial<AgentForm & AgentCapabilities> = {
        ...actions,
        agent: update,
        model: update.model,
        tools: update.tools ?? [],
      };

      Object.entries(fullAgent).forEach(([name, value]) => {
        if (name === 'model_parameters') {
          formValues[name] = value;
          return;
        }

        if (!keys.has(name)) {
          return;
        }

        if (typeof value !== 'number' && typeof value !== 'object') {
          formValues[name] = value;
        }
      });

      reset(formValues);
    },
    [reset],
  );

  const onSelect = useCallback(
    (selectedId: string) => {
      const agentExists = !!(selectedId
        ? (agents ?? []).find((agent) => agent.id === selectedId)
        : undefined);

      createMutation.reset();
      if (!agentExists) {
        setCurrentAgentId(undefined);
        return reset({
          ...defaultAgentFormValues,
        });
      }

      setCurrentAgentId(selectedId);
      const agent = agentQuery.data;
      if (!agent) {
        console.warn('Agent not found');
        return;
      }

      resetAgentForm(agent);
    },
    [agents, createMutation, setCurrentAgentId, agentQuery.data, resetAgentForm, reset],
  );

  useEffect(() => {
    if (agentQuery.data && agentQuery.isSuccess) {
      resetAgentForm(agentQuery.data);
    }
  }, [agentQuery.data, agentQuery.isSuccess, resetAgentForm]);

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    if (selectedAgentId === lastSelectedAgent.current) {
      return;
    }

    if (selectedAgentId != null && selectedAgentId !== '' && agents) {
      timerId = setTimeout(() => {
        lastSelectedAgent.current = selectedAgentId;
        onSelect(selectedAgentId);
      }, 5);
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [selectedAgentId, agents, onSelect]);

  const createAgent = localize('com_ui_create') + ' ' + localize('com_ui_agent');
  const hasAgentValue = !!(typeof currentAgentValue === 'object'
    ? currentAgentValue.value != null && currentAgentValue.value !== ''
    : typeof currentAgentValue !== 'undefined');

  return (
    <SelectDropDown
      value={!hasAgentValue ? createAgent : (currentAgentValue as TAgentOption)}
      setValue={createDropdownSetter(onSelect)}
      availableValues={
        agents ?? [
          {
            label: 'Loading...',
            value: '',
          },
        ]
      }
      iconSide="left"
      optionIconSide="right"
      showAbove={false}
      showLabel={false}
      emptyTitle={true}
      showOptionIcon={true}
      containerClassName="flex-grow"
      searchClassName="dark:from-gray-850"
      searchPlaceholder={localize('com_agents_search_name')}
      optionsClass="hover:bg-gray-20/50 dark:border-gray-700"
      optionsListClass="rounded-lg shadow-lg dark:bg-gray-850 dark:border-gray-700 dark:last:border"
      currentValueClass={cn(
        'text-md font-semibold text-gray-900 dark:text-white',
        hasAgentValue ? 'text-gray-500' : '',
      )}
      className={cn(
        'mt-1 rounded-md dark:border-gray-700 dark:bg-gray-850',
        'z-50 flex h-[40px] w-full flex-none items-center justify-center px-4 hover:cursor-pointer hover:border-green-500 focus:border-gray-400',
      )}
      renderOption={() => (
        <span className="flex items-center gap-1.5 truncate">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-800 dark:text-gray-100">
            <Plus className="w-[16px]" />
          </span>
          <span className={cn('ml-4 flex h-6 items-center gap-1 text-gray-800 dark:text-gray-100')}>
            {createAgent}
          </span>
        </span>
      )}
    />
  );
}
