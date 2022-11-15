import { Box } from '@mui/material';
import { createForm, FormRenderer } from './form-builder';
import { object, string, number } from 'yup';

const formDef = createForm({ 
  schema: (
    object({
      name: object({
        first: string().required("First name is required."),
        last: string().required("Last name is required.")
      }).required(),
      age: number().integer().required(),
      favoriteNumber: number(),
    }).required()
  ),
  layout: ({ Row, Col, Input, Box }) => (
  <Col hidden={[['age'], ({ age }) => age < 18]}>
    <Input 
      label={'Age'}
      name={'age'}
      disabled={['name.first', ({ age }) => age > 5]}
      className={'test'}
      hidden={({ age }) => age > 5}
    />
    <Row>
      <Input label={'First'} name={'name.first'}/>
      <Input label={'Last'} name={'name.last'} disabled={['age', ({ age }) => !(age >= 18)]}/>
    </Row>
  </Col>
  ),
  inputWidgets: {
    "test": { type: "string", render: () => null },
    "test2": { type: "int", render: () => null }
  },
  layoutWidgets: {
    Box,
  }
});

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Box sx={{ margin: '20px', display: 'flex', flexDirection: 'column', flex: '1' }}>
        <FormRenderer definition={formDef}/>
      </Box>
    </Box>
  );
}

export default App;
