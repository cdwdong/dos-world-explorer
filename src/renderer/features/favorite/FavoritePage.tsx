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
import WorldInfoModal from '@src/renderer/components/WorldInfoModal';
import StarSelect from '@src/renderer/components/world/StarSelect';
import useFavoritePage from './hooks/useFavoritePage';

const { TabPane } = Tabs;
const { Column } = Table;
const { Option } = Select;
const { Search } = Input;

export default function FavoritePage() {
  const hookMember = useFavoritePage();

  const renderedTabs = hookMember.typeList.map((e) => (
    <TabPane tab={e} key={e} />
  ));

  return (
    <Flex css={{ paddingLeft: spacing(1), paddingRight: spacing(1) }}>
      <WorldInfoModal
        onCancel={() => {
          hookMember.onClickToggleInfoModal(undefined);
        }}
        visible={hookMember.modalWorldInfo ? true : false}
        world={hookMember.modalWorldInfo}
      />

      {/* <Search
        placeholder="Type Search Text"
        allowClear
        onSearch={hookMember.onSearchWorlds}
        css={{
          marginTop: spacing(1),
        }}
        loading={hookMember.isLoading}
      /> */}

      <Tabs
        activeKey={hookMember.currentType}
        onChange={hookMember.onChangeType}
      >
        {renderedTabs}
      </Tabs>
      {/* <Button
        size="small"
        css={{ marginLeft: 'auto', alignSelf: 'center' }}
        icon={<ReloadOutlined />}
        onClick={() => hookMember.onClickRefresh()}
        loading={hookMember.isLoading}
      /> */}

      <FlexRow css={{ marginLeft: 'auto', alignItems: 'center' }}>
        별점 필터:&nbsp;
        <StarSelect
          value={hookMember.currentScoreFilter}
          onSelect={hookMember.onChangeScoreFilter}
        />
        <div css={{ marginLeft: spacing(1) }} />
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => hookMember.onClickRefresh()}
          loading={hookMember.isLoading}
        />
      </FlexRow>

      <Spin spinning={hookMember.isLoading}>
        <Table
          dataSource={hookMember.worldData}
          scroll={{
            x: true,
          }}
          pagination={{
            pageSize: 100,
          }}
        >
          <Column
            width="5%"
            title=""
            key="favorite"
            render={(_, record: World) => {
              if (hookMember.checkIsFavorite(record)) {
                return (
                  <HeartFilled
                    css={{ color: red.primary, fontSize: 20 }}
                    onClick={() => hookMember.onClickFavorite(record)}
                  />
                );
              }
              return (
                <HeartOutlined
                  css={{ color: red.primary, fontSize: 20 }}
                  onClick={() => hookMember.onClickFavorite(record)}
                />
              );
            }}
          />
          <Column
            width="10%"
            title="이미지"
            dataIndex="imageUrl"
            render={(imageUrl, record: World) => (
              <Image
                src={imageUrl}
                width={130}
                preview={false}
                onClick={(e) => {
                  hookMember.onClickToggleInfoModal(record);
                }}
              />
            )}
          />
          <Column
            width="10%"
            title="제목"
            dataIndex="name"
            sorter={(a: World, b: World) => a.name.localeCompare(b.name)}
            showSorterTooltip={false}
            onCell={(w) => ({
              style: {
                width: 200,
                wordBreak: 'keep-all',
              },
            })}
            ellipsis
            render={(_, world) => (
              <Typography.Link
                onClick={(e) => {
                  hookMember.onClickToggleInfoModal(world);
                }}
              >
                {world.name}
              </Typography.Link>
            )}
          />
          <Column
            width="10%"
            title="제작자"
            dataIndex="author"
            sorter={(a: World, b: World) => a.author.localeCompare(b.author)}
            showSorterTooltip={false}
            ellipsis
          />
          <Column
            width="20%"
            title="설명"
            dataIndex="description"
            render={(value) => (
              <Typography.Paragraph
                css={{ wordBreak: 'keep-all', width: '24vw' }}
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
                    <span key={tag}>
                      <Tag color={color}>{tag.toUpperCase()}</Tag>
                      {(index + 1) / 4 > 0 && (index + 1) % 4 === 0 ? (
                        <br />
                      ) : undefined}
                    </span>
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
            showSorterTooltip={false}
          />
          {/* <Column
            width="15%"
            title="URL"
            dataIndex="url"
            render={(url: string) => (
              <Typography.Link href={url} target="_blank">
                {url}
              </Typography.Link>
            )}
          /> */}
          {/* <Column
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
          /> */}
        </Table>
      </Spin>
    </Flex>
  );
}
