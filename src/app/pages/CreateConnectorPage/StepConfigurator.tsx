import { useCreateConnectorWizardService } from '@app/components/CreateConnectorWizard/CreateConnectorWizardContext';
import { JsonSchemaConfigurator } from '@app/components/JsonSchemaConfigurator/JsonSchemaConfigurator';
import { StepBodyLayout } from '@app/components/StepBodyLayout/StepBodyLayout';
import { ConfiguratorActorRef } from '@app/machines/StepConfigurator.machine';
import {
  ConnectorConfiguratorComponent,
  ConnectorConfiguratorProps,
} from '@app/machines/StepConfiguratorLoader.machine';
import { mapToObject } from '@utils/shared';
import _ from 'lodash';
import React, { ComponentType, FunctionComponent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useSelector } from '@xstate/react';

import {
  EmptyState,
  EmptyStateIcon,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import { ConnectorTypeAllOf } from '@rhoas/connector-management-sdk';

const clearEmptyObject = (obj: any) => {
  return Object.keys(obj).map((key) => {
    if (_.isEmpty((obj as { [key: string]: any })[key])) {
      (obj as { [key: string]: any })[key] = '';
    }
  });
};
const ConnectedCustomConfigurator: FunctionComponent<{
  Configurator: ConnectorConfiguratorComponent;
  actor: ConfiguratorActorRef;
  duplicateMode: boolean | undefined;
}> = ({ actor, Configurator, duplicateMode }) => {
  let { activeStep, configuration, connector, connectorData } = useSelector(
    actor,
    useCallback(
      (state: typeof actor.state) => {
        return {
          connector: state.context.connector,
          activeStep: state.context.activeStep,
          configuration: state.context.configuration,
          connectorData: state.context.connectorData,
        };
      },
      [actor]
    )
  );
  if (duplicateMode) {
    clearEmptyObject(configuration);
    const defaultEntries = JSON.parse(JSON.stringify(connectorData?.connector));
    let combineConfiguration = {};
    if (configuration instanceof Map) {
      combineConfiguration = _.merge(
        {},
        defaultEntries,
        mapToObject(configuration)
      );
    } else {
      combineConfiguration = _.merge({}, defaultEntries, configuration);
    }
    configuration = new Map(Object.entries(combineConfiguration));
  }
  return (
    <Configurator
      activeStep={activeStep}
      configuration={configuration}
      connector={connector}
      duplicateMode={duplicateMode}
      onChange={(configuration, isValid) => {
        actor.send({ type: 'change', configuration, isValid });
      }}
    />
  );
};

const ConnectedJsonSchemaConfigurator: FunctionComponent<{
  actor: ConfiguratorActorRef;
  duplicateMode: boolean | undefined;
}> = ({ actor, duplicateMode }) => {
  const { configuration, connector } = useSelector(
    actor,
    useCallback(
      (state: typeof actor.state) => ({
        connector: state.context.connector,
        configuration: state.context.configuration,
      }),
      [actor]
    )
  );
  if (duplicateMode) clearEmptyObject(configuration);

  return (
    <JsonSchemaConfigurator
      schema={(connector as ConnectorTypeAllOf).schema!}
      configuration={configuration || {}}
      duplicateMode={duplicateMode}
      onChange={(configuration, isValid) =>
        actor.send({ type: 'change', configuration, isValid })
      }
    />
  );
};

export type ConfiguratorStepProps = {
  Configurator: ComponentType<ConnectorConfiguratorProps> | false;
};

export const ConfiguratorStep: FunctionComponent = () => {
  const { t } = useTranslation();
  const service = useCreateConnectorWizardService();
  const {
    isLoading,
    hasErrors,
    Configurator,
    configuratorRef,
    hasCustomConfigurator,
    duplicateMode,
  } = useSelector(
    service,
    useCallback(
      (state: typeof service.state) => {
        const isLoading = state.matches({
          configureConnector: 'loadConfigurator',
        });
        const hasErrors = state.matches('failure');
        const hasCustomConfigurator =
          state.context.Configurator !== false &&
          state.context.Configurator !== undefined;
        return {
          isLoading,
          hasErrors,
          hasCustomConfigurator,
          configuration: state.context.connectorConfiguration,
          Configurator: state.context.Configurator,
          duplicateMode: state.context.duplicateMode,
          configuratorRef: state.children
            .configuratorRef as ConfiguratorActorRef,
        };
      },
      [service]
    )
  );
  return (
    <StepBodyLayout
      title={t('Configurations')}
      description={t('configurationStepDescription')}
    >
      {(() => {
        switch (true) {
          case isLoading:
            return (
              <EmptyState>
                <EmptyStateIcon variant="container" component={Spinner} />
                <Title size="lg" headingLevel="h4">
                  {t('loading')}
                </Title>
              </EmptyState>
            );
          case hasErrors:
            return (
              <EmptyState>
                <EmptyStateIcon icon={ExclamationCircleIcon} />
                <Title size="lg" headingLevel="h4">
                  Error message
                </Title>
              </EmptyState>
            );
          case hasCustomConfigurator:
            return (
              <React.Suspense fallback={null}>
                <ConnectedCustomConfigurator
                  actor={configuratorRef}
                  Configurator={Configurator as ConnectorConfiguratorComponent}
                  duplicateMode={duplicateMode}
                />
              </React.Suspense>
            );
          default:
            return (
              <ConnectedJsonSchemaConfigurator
                actor={configuratorRef}
                duplicateMode={duplicateMode}
              />
            );
        }
      })()}
    </StepBodyLayout>
  );
};
