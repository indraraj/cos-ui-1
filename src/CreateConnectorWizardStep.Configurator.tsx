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

import { CreateConnectorWizardBodyLayout } from './CreateConnectorWizardBodyLayout';
import { useCreateConnectorWizardService } from './CreateConnectorWizardContext';
import { ConfiguratorActorRef } from './CreateConnectorWizardStep.Configurator.machine';
import {
  ConnectorConfiguratorComponent,
  ConnectorConfiguratorProps,
} from './CreateConnectorWizardStep.ConfiguratorLoader.machine';
import { JsonSchemaConfigurator } from './JsonSchemaConfigurator';

const ConnectedCustomConfigurator: FunctionComponent<{
  Configurator: ConnectorConfiguratorComponent;
  actor: ConfiguratorActorRef;
}> = ({ actor, Configurator }) => {
  const { activeStep, configuration, connector } = useSelector(
    actor,
    useCallback(
      (state: typeof actor.state) => ({
        connector: state.context.connector,
        activeStep: state.context.activeStep,
        configuration: state.context.configuration,
      }),
      [actor]
    )
  );

  return (
    <Configurator
      activeStep={activeStep}
      configuration={configuration}
      connector={connector}
      onChange={(configuration, isValid) =>
        actor.send({ type: 'change', configuration, isValid })
      }
    />
  );
};

const ConnectedJsonSchemaConfigurator: FunctionComponent<{
  actor: ConfiguratorActorRef;
}> = ({ actor }) => {
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

  return (
    <JsonSchemaConfigurator
      schema={connector.json_schema!}
      configuration={configuration || {}}
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
          configuratorRef: state.children
            .configuratorRef as ConfiguratorActorRef,
        };
      },
      [service]
    )
  );

  return (
    <CreateConnectorWizardBodyLayout
      title={t('Configurations')}
      description={
        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit error adipisci, ducimus ipsum dicta quo beatae ratione aliquid nostrum animi eos, doloremque laborum quasi sed, vitae ipsa illo delectus! Quos'
      }
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
                />
              </React.Suspense>
            );
          default:
            return <ConnectedJsonSchemaConfigurator actor={configuratorRef} />;
        }
      })()}
    </CreateConnectorWizardBodyLayout>
  );
};