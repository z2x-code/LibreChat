import { useMemo } from 'react';
import {
  ArrowRightToLine,
  MessageSquareQuote,
  // Settings2,
} from 'lucide-react';
import {
  EModelEndpoint,
  isAssistantsEndpoint,
  PermissionTypes,
  Permissions,
} from 'librechat-data-provider';
import type { TConfig, TInterfaceConfig } from 'librechat-data-provider';
import type { NavLink } from '~/common';
import PanelSwitch from '~/components/SidePanel/Builder/PanelSwitch';
import PromptsAccordion from '~/components/Prompts/PromptsAccordion';
// import Parameters from '~/components/SidePanel/Parameters/Panel';
import FilesPanel from '~/components/SidePanel/Files/Panel';
import { Blocks, AttachmentIcon } from '~/components/svg';
import { useHasAccess } from '~/hooks';

export default function useSideNavLinks({
  hidePanel,
  assistants,
  keyProvided,
  endpoint,
  interfaceConfig,
}: {
  hidePanel: () => void;
  assistants?: TConfig | null;
  keyProvided: boolean;
  endpoint?: EModelEndpoint | null;
  interfaceConfig: Partial<TInterfaceConfig>;
}) {
  const hasAccess = useHasAccess({
    permissionType: PermissionTypes.PROMPTS,
    permission: Permissions.USE,
  });

  const Links = useMemo(() => {
    const links: NavLink[] = [];
    if (hasAccess) {
      links.push({
        title: 'com_ui_prompts',
        label: '',
        icon: MessageSquareQuote,
        id: 'prompts',
        Component: PromptsAccordion,
      });
    }
    if (
      isAssistantsEndpoint(endpoint) &&
      assistants &&
      assistants.disableBuilder !== true &&
      keyProvided &&
      interfaceConfig.parameters
    ) {
      links.push({
        title: 'com_sidepanel_assistant_builder',
        label: '',
        icon: Blocks,
        id: 'assistants',
        Component: PanelSwitch,
      });
    }

    links.push({
      title: 'com_sidepanel_attach_files',
      label: '',
      icon: AttachmentIcon,
      id: 'files',
      Component: FilesPanel,
    });

    links.push({
      title: 'com_sidepanel_hide_panel',
      label: '',
      icon: ArrowRightToLine,
      onClick: hidePanel,
      id: 'hide-panel',
    });

    return links;
  }, [assistants, keyProvided, hidePanel, endpoint, interfaceConfig.parameters, hasAccess]);

  return Links;
}
