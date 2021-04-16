import * as React from 'react';
import { useInterpret } from '@xstate/react';
import { Interpreter, StateMachine } from 'xstate';
import {
  configuratorLoaderMachine,
  ConnectorConfiguratorProps,
  ConnectorConfiguratorResponse,
  creationWizardMachine,
} from '@kas-connectors/machines';
import { ConnectorType } from '@kas-connectors/api';
import { DebeziumConfigurator } from './debezium/DebeziumConfigurator';

export type InterpreterFrom<
  T extends StateMachine<any, any, any, any>
> = T extends StateMachine<
  infer TContext,
  infer TStateSchema,
  infer TEvent,
  infer TTypestate
>
  ? Interpreter<TContext, TStateSchema, TEvent, TTypestate>
  : never;

type InterpretType = InterpreterFrom<typeof creationWizardMachine>;
type CreationWizardMachineServiceType = InterpretType | null;

const CreationWizardMachineService = React.createContext<
  CreationWizardMachineServiceType
>(null);

export const useCreationWizardMachineService = () => {
  const service = React.useContext(CreationWizardMachineService);
  if (!service) {
    throw new Error(
      `useCreationWizardMachineService() must be used in a child of <CreationWizardMachineProvider>`
    );
  }
  return service;
};

type CreationWizardMachineProviderPropsType = {
  authToken?: Promise<string>;
  basePath?: string;
};

export const CreationWizardMachineProvider: React.FunctionComponent<CreationWizardMachineProviderPropsType> = ({
  children,
  authToken,
  basePath,
}) => {
  const makeConfiguratorLoaderMachine = React.useCallback(
    () =>
      configuratorLoaderMachine.withConfig({
        services: {
          fetchConfigurator: context => fetchConfigurator(context.connector),
        },
      }),
    []
  );
  const service = useInterpret(
    creationWizardMachine,
    {
      devTools: true,
      context: {
        authToken,
        basePath,
      },
      services: {
        makeConfiguratorLoaderMachine,
      },
    },
    state => {
      // subscribes to state changes
      console.log(state.value);
    }
  );
  return (
    <CreationWizardMachineService.Provider value={service}>
      {children}
    </CreationWizardMachineService.Provider>
  );
};

// WARNING: from this line below is all placeholder code that will be removed

const SampleMultiStepConfigurator: React.FunctionComponent<ConnectorConfiguratorProps> = props => (
  <div>
    <p>
      Active step {props.activeStep} of {props.connector.id}
    </p>
    <button
      onClick={() =>
        props.onChange(
          props.activeStep === 2 ? { foo: 'bar' } : undefined,
          true
        )
      }
    >
      Set valid
    </button>
  </div>
);

const fetchConfigurator = (
  connector: ConnectorType
): Promise<ConnectorConfiguratorResponse> => {
  switch (connector.id) {
    case 'aws-kinesis-source':
      // this will come from a remote entry point, eg. debezium
      return Promise.resolve({
        steps: ['First step', 'Second step', 'Third step'],
        Configurator: SampleMultiStepConfigurator,
      });
    case 'aws-sqs-source-v1alpha1':
      // this will come from a remote entry point, eg. debezium
      return Promise.resolve({
        steps: [
          'Properties',
          'Filter Configuration',
          'Data Options',
          'Runtime Options',
        ],
        Configurator: DebeziumConfigurator,
      });
    default:
      return Promise.resolve({
        steps: false,
        Configurator: () => <p>TODO: json-schema based configurator</p>,
      });
  }
};