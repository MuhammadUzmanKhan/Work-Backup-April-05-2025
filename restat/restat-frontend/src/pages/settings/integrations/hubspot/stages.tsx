import React, { useState, useEffect, useMemo } from 'react';
import { Select, Typography } from 'antd';
import { IStages } from '../../../../services/types/integrations';
import './index.scss';

interface PipelineProps {
  stages: IStages[];
  isDisabled: boolean;
  onChangeHandler: (stageData: { id: any; label: string }) => void;
}

const Stages: React.FC<PipelineProps> = ({ stages, isDisabled, onChangeHandler }) => {
  const [selectedStageId, setSelectedStageId] = useState<string | undefined>(undefined);

  const { Title } = Typography

  const handleStageChange = (stageId: string) => {
    const selectedStage = stages.find(stage => stage.id === stageId);
    if (selectedStage) {
      setSelectedStageId(selectedStage.id);
      onChangeHandler({ id: selectedStage.id, label: selectedStage.label });
    }
  };

  useEffect(() => {
    if (stages && stages.length > 0) {
      const firstStage = stages[0];
      setSelectedStageId(firstStage.id);
    }
  }, [stages]);

  const options = useMemo(() => stages?.length ?
    stages.map(stage => ({ label: stage?.label, value: stage?.id }))
    : undefined, [stages]);

  return (
    <div className="stage-container">
      <Title style={{color:'#0056b3'}} level={3}>Select the Stage </Title>
      <Select
        showSearch
        placeholder="Select a stage"
        optionFilterProp="label"
        value={selectedStageId}
        onChange={handleStageChange}
        options={options}
        disabled={isDisabled}
        size='large'
        style={{ minWidth: '280px' }}
      />
    </div>
  );
}

export default Stages;
