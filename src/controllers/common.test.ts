import {getLogger} from "./common";

describe("Common", () => {
  describe("getLogger()", () => {
    it("should extract a logger instance from a request", () => {
      const logger = getLogger({
        // @ts-ignore
        logger: {}
      });
      expect(logger).toBeDefined();
    })
  });
});
