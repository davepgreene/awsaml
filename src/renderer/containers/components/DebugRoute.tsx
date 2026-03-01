import {
  Container,
  Row,
  Col,
} from 'reactstrap';
import { useLocation } from 'react-router-dom';

const COLUMN_STYLE = {
  fontSize: '1.2rem',
};

const generateDebugReport = (location: { hash: string; pathname: string; search: string }) => `
pathname: ${location.pathname}
search: ${location.search}
hash: ${location.hash}
`.trim();

function DebugRoute() {
  const location = useLocation();

  return (
    <Container>
      <Row>
        <Col style={COLUMN_STYLE}>
          Route:
          <pre className="language-bash">
            {generateDebugReport(location)}
          </pre>
        </Col>
      </Row>
    </Container>
  );
}

export default DebugRoute;
