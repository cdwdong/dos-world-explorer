import { FlexCenter, FlexRow } from '@src/renderer/components/styledComponents';
import simpleStringHash from '@src/renderer/utils/simpleStringHash';
import { World, WorldEditInput } from '@src/types';
import { Button, Image, Modal, Tag, Typography } from 'antd';
import { PresetColorTypes } from 'antd/lib/_util/colors';
import { format } from 'date-fns';
import WorldInstanceCreationModal from '../components/WorldInstanceCreationModal';
import { useState } from 'react';

interface Props {
  onOk?: (e: WorldEditInput) => void;
  onCancel?: () => void;
  onEdit?: (worldKey?: string) => void;
  onRemove?: (worldKey?: string) => void;
  visible: boolean;
  world?: World;
}

function WorldInfoModal(props: Props) {
  const [visibleInstanceModal, setVisibleInstanceModal] = useState(false);

  return (
    <Modal
      title={props.world?.name}
      onOk={() => {
        props.onCancel?.();
      }}
      destroyOnClose
      onCancel={props.onCancel}
      visible={props.visible}
      width="60%"
      footer={[]}
    >
      <WorldInstanceCreationModal
        onCancel={() => {
          setVisibleInstanceModal(false);
        }}
        visible={visibleInstanceModal}
        world={props.world}
      />

      {props.world && (
        <>
          <FlexCenter>
            <Image src={props.world.imageUrl} width="70%"></Image>
          </FlexCenter>
          <br />
          <FlexRow>
            <div css={{ flex: 1 }}>
              <Typography.Title level={5}>
                <div>제작자: {props.world.author}</div>
                <div>
                  별점: <StarScore score={props.world.score} />
                </div>
                타입: {props.world.type}
                <div>
                  {props.world.tags.map((tag) => {
                    const colorIndex =
                      simpleStringHash(tag) % PresetColorTypes.length;
                    const color = PresetColorTypes[colorIndex];
                    return (
                      <Tag color={color} key={tag}>
                        {tag.toUpperCase()}
                      </Tag>
                    );
                  })}
                </div>
              </Typography.Title>
              <div css={{ marginTop: 20 }}>
                <Typography.Text>
                  Recorded Date:{' '}
                  {format(props.world.date, 'yyyy-MM-dd HH:mm:ss')} GMT{' '}
                  {props.world.date.getTimezoneOffset() / 60}
                  <br />
                  ID: {props.world.key}
                </Typography.Text>
              </div>
            </div>

            <div css={{ flex: 1 }}>
              <ButtonWorldLink
                worldKey={props.world.key}
                url={props.world.url}
              />
              <ButtonInstanceCreation
                worldKey={props.world.key}
                url={props.world.url}
                onClickInstance={() => setVisibleInstanceModal(true)}
              />
              <Button
                type="primary"
                css={{ marginLeft: 'auto' }}
                onClick={() => {
                  props.onEdit?.(props.world?.key);
                }}
              >
                수정
              </Button>
              <Button
                danger
                css={{ marginLeft: 'auto' }}
                onClick={() => {
                  props.onRemove?.(props.world?.key);
                }}
              >
                삭제
              </Button>
              <br />
              <Typography.Paragraph css={{ marginTop: 20 }}>
                {props.world.description}
              </Typography.Paragraph>
            </div>
          </FlexRow>
        </>
      )}
    </Modal>
  );
}

export default WorldInfoModal;

function StarScore(props: { score: number }) {
  let stars = '';
  for (let i = 0; i < props.score; i++) {
    stars += '⭐';
  }

  return <>{stars}</>;
}

function ButtonWorldLink(props: { worldKey: string; url: string }) {
  let btnName = 'Link';

  if (props.worldKey.charAt(0) === 'n' && props.worldKey.charAt(1) === 'o') {
    return (
      <Button disabled css={{ marginLeft: 'auto' }}>
        {btnName}
      </Button>
    );
  }
  return (
    <Typography.Link target="_blank" href={props.url}>
      <Button css={{ marginLeft: 'auto' }}>{btnName}</Button>
    </Typography.Link>
  );
}

function ButtonInstanceCreation(props: { worldKey: string; url: string, onClickInstance: () => void }) {
  let btnName = '인스턴스 생성';

  if (props.worldKey.charAt(0) === 'n' && props.worldKey.charAt(1) === 'o') {
    return (
      <Button disabled css={{ marginLeft: 'auto' }}>
        {btnName}
      </Button>
    );
  }
  return (
    <Typography.Link target="_blank">
      <Button css={{ marginLeft: 'auto' }} onClick={(e) => {
        props.onClickInstance();
      }}>{btnName}</Button>
    </Typography.Link>
  );
}
