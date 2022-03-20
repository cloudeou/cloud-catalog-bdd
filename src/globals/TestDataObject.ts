export class TestDataObject {
  public InputObject() {
    return {};
  }

  public ExpectedObject() {
    return {};
  }

  public OutputObject() {
    return {};
  }

  public UiTestDataObject() {
    const testObj = {
      request: this.InputObject(),
      response: this.OutputObject(),
      expected: this.ExpectedObject(),
      result: 'INCOMPLETE',
      screenshotLocation: '',
      error: {},
      indexId: -1,
    };
    return testObj;
  }
}
