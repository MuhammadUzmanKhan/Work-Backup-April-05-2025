import React, { useState, useEffect, useMemo } from 'react';
import { Select, Typography } from 'antd';
import { IPipeline } from '../../../../services/types/integrations';
import './index.scss';

interface PipelineProps {
  pipelines: IPipeline[];
  isDisabled: boolean;
  onChangeHandler: (pipelineData: { id: any; label: string, index: number }) => void;
}

const Pipeline: React.FC<PipelineProps> = ({ pipelines, isDisabled, onChangeHandler }) => {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>(undefined);

  const { Title } = Typography

  const handlePipelineChange = (pipelineId: string) => {
    const selectedPipeline = pipelines.find(pipeline => pipeline.id === pipelineId);
    const selectedIndex = pipelines?.findIndex(pipeline => pipeline.id === pipelineId) || 0;
    if (selectedPipeline) {
      setSelectedPipelineId(selectedPipeline.id);
      onChangeHandler({ id: selectedPipeline.id, label: selectedPipeline.label, index: selectedIndex });
    }
  };

  useEffect(() => {
    if (pipelines && pipelines.length > 0) {
      const firstPipeline = pipelines[0];
      setSelectedPipelineId(firstPipeline.id);
    }
  }, [pipelines]);

  const options = useMemo(() => pipelines?.length ?
    pipelines.map(pipeline => ({ label: pipeline?.label, value: pipeline?.id }))
    : undefined, [pipelines]);

  return (
    <div className="pipeline-container">
      <Title style={{color:'#0056b3'}} level={3}>Select the Pipeline </Title>
      <Select
        showSearch
        placeholder="Select a pipeline"
        optionFilterProp="label"
        value={selectedPipelineId}
        onChange={handlePipelineChange}
        options={options}
        disabled={isDisabled}
        size='large'
        style={{ minWidth: '280px' }}
      />
    </div>
  );
}

export default Pipeline;
