import React from 'react';
import moment from 'moment';
import Tiers from 'shared/tiers';
import { Typography, Space, Avatar, Empty } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { UpcomingMatchResponse } from 'renderer/screens/main/types';
import { parseMapForMatch } from 'shared/util';
import './match-preview.scss';


interface Props {
  data: UpcomingMatchResponse;
  cs16_enabled?: boolean;
  onClick?: ( id: number ) => void;
}


export default function MatchPreview( props: Props ) {
  if( !props.data ) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_DEFAULT}
        description="No upcoming matches."
      />
    );
  }

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <Typography.Text type="secondary">
          {moment( props.data.date ).format( 'ddd, MMM DD, YYYY' )}
        </Typography.Text>
        <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 0 }}>
          {props.data.competition}: {props.data.region}
        </Typography.Title>
        <Typography.Text>
          {props.data.division}
          {props.data.postseason && `
            (Promotion ${props.data.postseason})
          `}
        </Typography.Text>
      </div>
      <div className="match-preview-body">
        <section onClick={() => !!props.onClick && props.onClick( props.data.match.team1.id )}>
          <Space direction="vertical" size={2}>
            <Avatar size={100} icon={<UserOutlined />} />
            <Typography.Text ellipsis>{props.data.match.team1.name}</Typography.Text>
            {typeof props.data.match.team1.tier === 'number'  && (
              <Typography.Text className="tier-text">
                {Tiers[ props.data.match.team1.tier ].name}
              </Typography.Text>
            )}
          </Space>
        </section>
        <Typography.Text strong className="vs">
          {'VS'}
        </Typography.Text>
        <section onClick={() => !!props.onClick && props.onClick( props.data.match.team2.id )}>
          <Space direction="vertical" size={2}>
            <Avatar size={100} icon={<UserOutlined />} />
            <Typography.Text ellipsis>{props.data.match.team2.name}</Typography.Text>
            {typeof props.data.match.team2.tier === 'number' && (
              <Typography.Text className="tier-text">
                {Tiers[ props.data.match.team2.tier ].name}
              </Typography.Text>
            )}
          </Space>
        </section>
      </div>
      <div className="match-preview-footer">
        <Typography.Text mark>
          {props.data.match.data
            ? parseMapForMatch( props.data.match.data.map, props.cs16_enabled )
            : 'TBD'
          }
        </Typography.Text>
      </div>
    </>
  );
}
