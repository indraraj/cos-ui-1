import React from 'react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  CardFooter,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  ExternalLinkSquareAltIcon,
  PlusCircleIcon,
} from '@patternfly/react-icons';

import { useTranslation } from '@rhoas/app-services-ui-components';

export const ROSAEmptyCard: React.FunctionComponent = () => {
  const { t } = useTranslation();
  return (
    <Card
      isSelected={false}
      isDisabledRaised={false}
      isSelectableRaised={false}
      id="rosa-empty-card"
      hasSelectableInput={false}
    >
      <CardTitle>
        <CardHeader>
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            justifyContent={{ default: 'justifyContentCenter' }}
            style={{ width: '100%' }}
          >
            <FlexItem>
              <PlusCircleIcon size="xl" />
            </FlexItem>
          </Flex>
        </CardHeader>
        <CardTitle style={{ textAlign: 'center' }}>
          {t('createRosaNamespace')}
        </CardTitle>
      </CardTitle>
      <CardBody>{t('rosaAddOnMsg')}</CardBody>
      <CardFooter>
        <Button
          variant="link"
          isInline
          component="span"
          icon={<ExternalLinkSquareAltIcon />}
          iconPosition="right"
        >
          {t('addOnLink')}
        </Button>
      </CardFooter>
    </Card>
  );
};
