import styled from 'styled-components';

interface MDProps {
    children: string;
}

const StyledMD = styled.div``;

export const MD: React.FC<MDProps> = ({ children }) => <StyledMD dangerouslySetInnerHTML={{ __html: children }} />;
