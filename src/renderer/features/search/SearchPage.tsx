import {
  HeartFilled,
  HeartOutlined,
  ReloadOutlined,
  StarFilled,
} from '@ant-design/icons';
import {
  Button,
  Image,
  Input,
  Popconfirm,
  Select,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { gold, red } from '@ant-design/colors';
import { PresetColorTypes } from 'antd/lib/_util/colors';
import { Flex, FlexRow } from '@src/renderer/components/styledComponents';
import simpleStringHash from '@src/renderer/utils/simpleStringHash';
import { spacing } from '@src/renderer/utils/styling';
import { World } from '@src/types';
import useSearchPage from './hooks/useSearchPage';
import AddWorldModal from './AddWorldModal';
import WorldInfoModal from './WorldInfoModal';
import { css } from '@emotion/react';

const { TabPane } = Tabs;
const { Column } = Table;
const { Option } = Select;
const { Search } = Input;

export default function SearchPage() {
  const hookMember = useSearchPage();

  const renderedTabs = hookMember.typeList.map((e) => (
    <TabPane tab={e} key={e} />
  ));

  return (
    <Flex css={{ paddingLeft: spacing(1), paddingRight: spacing(1) }}>
      <AddWorldModal
        onCancel={() => {
          hookMember.onClickCloseAddWorldModal();
        }}
        onOk={(w) => {
          hookMember.onAddWorld(w);
        }}
        visible={hookMember.visibleAddWorldModal}
        types={hookMember.typeList}
      />
      <WorldInfoModal
        onCancel={() => {
          hookMember.onClickCloseWorldInfoModal();
        }}
        onOk={() => {
          hookMember.onClickCloseWorldInfoModal();
        }}
        visible={hookMember.visibleWorldInfoModal}
        types={hookMember.typeList}
        worldKey={hookMember.keyOfWorldInfoModal}
      />
      <Search
        placeholder="Type Search Text"
        allowClear
        onSearch={hookMember.onSearchWorlds}
        css={{
          marginTop: spacing(1),
        }}
        loading={hookMember.isLoading}
      />

      <Tabs
        activeKey={hookMember.currentType}
        onChange={hookMember.onChangeSheetTab}
      >
        {renderedTabs}
      </Tabs>
      <Button
        size="small"
        css={{ marginLeft: 'auto', alignSelf: 'center' }}
        icon={<ReloadOutlined />}
        onClick={() => hookMember.onClickRefresh()}
        loading={hookMember.isLoading}
      />

      <Spin spinning={hookMember.isLoading}>
        <Table
          dataSource={hookMember.currentTableData}
          scroll={{
            x: true,
          }}
          footer={(data) => (
            <FlexRow>
              <Button
                type="primary"
                css={{ marginLeft: 'auto' }}
                onClick={(e) => {
                  hookMember.onClickOpenAddWorldModal();
                }}
              >
                월드 추가
              </Button>
            </FlexRow>
          )}
        >
          <Column
            width="5%"
            title=""
            key="favorite"
            render={(_, record: World) => {
              if (hookMember.checkIsFavorite(record)) {
                return (
                  <HeartFilled
                    css={{ color: red.primary }}
                    onClick={() => hookMember.onClickFavorite(record)}
                  />
                );
              }
              return (
                <HeartOutlined
                  css={{ color: red.primary }}
                  onClick={() => hookMember.onClickFavorite(record)}
                />
              );
            }}
          />
          <Column
            width="10%"
            title="이미지"
            dataIndex="imageUrl"
            render={(imageUrl) => (
              <>
                <Image src={imageUrl} width={130} />
              </>
            )}
          />
          <Column
            width="10%"
            title="이름"
            dataIndex="name"
            sorter={(a: World, b: World) => a.name.localeCompare(b.name)}
            onCell={(w) => ({
              style: {
                width: 200,
                wordBreak: 'keep-all',
              },
            })}
            render={(_, world) => (
              <>
                <a
                  onClick={(e) => {
                    hookMember.onClickOpenWorldInfoModal(world.key);
                  }}
                >
                  {world.name}
                </a>
              </>
            )}
          />
          <Column
            width="10%"
            title="제작자"
            dataIndex="author"
            sorter={(a: World, b: World) => a.author.localeCompare(b.author)}
            ellipsis
          />
          <Column
            width="30%"
            title="설명"
            dataIndex="description"
            render={(value) => (
              <Typography.Paragraph
                css={{ wordBreak: 'keep-all', width: 180 }}
                ellipsis={{ rows: 3, expandable: true }}
              >
                {value}
              </Typography.Paragraph>
            )}
          />
          <Column
            width="15%"
            title="태그"
            dataIndex="tags"
            render={(tags: any[]) => (
              <>
                {tags.map((tag, index) => {
                  const colorIndex =
                    simpleStringHash(tag) % PresetColorTypes.length;
                  const color = PresetColorTypes[colorIndex];
                  return (
                    <>
                      <Tag color={color} key={tag}>
                        {tag.toUpperCase()}
                      </Tag>
                      {(index + 1) / 4 > 0 && (index + 1) % 4 === 0 ? (
                        <br />
                      ) : undefined}
                    </>
                  );
                })}
              </>
            )}
            ellipsis
          />
          <Column
            width="10%"
            title="별점"
            dataIndex="score"
            render={(score: number) => (
              <FlexRow>
                {new Array(score).fill(null).map((_, index) => (
                  <StarFilled key={index} css={{ color: gold.primary }} />
                ))}
              </FlexRow>
            )}
            sorter={(a: World, b: World) => a.score - b.score}
          />
          <Column
            width="15%"
            title="URL"
            dataIndex="url"
            render={(url: string) => (
              <Typography.Link href={url} target="_blank">
                {url}
              </Typography.Link>
            )}
          />
          <Column
            width="5%"
            dataIndex="key"
            render={(k, record) => (
              <Flex>
                <Popconfirm
                  title="정말 월드를 삭제하시겠습니까?"
                  placement="topRight"
                  onConfirm={() => hookMember.onRemoveWorld(k)}
                >
                  <Button danger size="small">
                    삭제
                  </Button>
                </Popconfirm>
              </Flex>
            )}
          />
        </Table>
      </Spin>
    </Flex>
  );
}