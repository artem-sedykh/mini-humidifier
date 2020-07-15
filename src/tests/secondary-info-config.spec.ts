import { Config } from '../models/config';
import { assert, expect } from 'chai';
import { ExecutionContext } from '../types';
import { instance, mock } from 'ts-mockito';
import { ACTION_TIMEOUT } from '../const';
import { StyleInfo } from 'lit-html/directives/style-map';

describe('secondary-info', () => {
  it('not allowed secondary info type', () => {
    const rawConfig = {
      entity: 'fan.t',
      model: 'empty',
      secondary_info: 'not allowed',
    };
    const config = new Config(rawConfig);

    assert.isDefined(config.secondaryInfo);
    const secondaryInfo = config.secondaryInfo;
    expect(secondaryInfo.type).to.equal('none');

    const contextMock: ExecutionContext = mock<ExecutionContext>();
    const context: ExecutionContext = instance(contextMock);

    assert.isFalse(secondaryInfo.disabled(undefined, context));
    assert.isFalse(secondaryInfo.disabled('test', context));
    assert.isFalse(secondaryInfo.disabled(10, context));
    assert.isFalse(secondaryInfo.disabled(false, context));
    assert.isFalse(secondaryInfo.disabled(true, context));

    assert.isFalse(secondaryInfo.active(undefined, context));
    assert.isFalse(secondaryInfo.active('test', context));
    assert.isFalse(secondaryInfo.active(10, context));
    assert.isFalse(secondaryInfo.active(false, context));
    assert.isFalse(secondaryInfo.active(true, context));

    expect(secondaryInfo.style(undefined, context)).to.deep.equal({});
    expect(secondaryInfo.style('test', context)).to.deep.equal({});
    expect(secondaryInfo.style(10, context)).to.deep.equal({});
    expect(secondaryInfo.style(false, context)).to.deep.equal({});
    expect(secondaryInfo.style(true, context)).to.deep.equal({});

    assert.isDefined(secondaryInfo.icon);
    assert.isFunction(secondaryInfo.icon.template);
    assert.isFunction(secondaryInfo.icon.style);

    expect(secondaryInfo.icon.style(undefined, context)).to.deep.equal({});
    expect(secondaryInfo.icon.style('test', context)).to.deep.equal({});
    expect(secondaryInfo.icon.style(10, context)).to.deep.equal({});
    expect(secondaryInfo.icon.style(false, context)).to.deep.equal({});
    expect(secondaryInfo.icon.style(true, context)).to.deep.equal({});

    assert.isUndefined(secondaryInfo.icon.template(undefined, context));
    assert.isUndefined(secondaryInfo.icon.template('test', context));
    assert.isUndefined(secondaryInfo.icon.template(10, context));
    assert.isUndefined(secondaryInfo.icon.template(false, context));
    assert.isUndefined(secondaryInfo.icon.template(true, context));

    expect(secondaryInfo.stateMapper(undefined, context)).to.equal(undefined);
    expect(secondaryInfo.stateMapper('test', context)).to.equal('test');
    expect(secondaryInfo.stateMapper(10, context)).to.equal(10);
    expect(secondaryInfo.stateMapper(false, context)).to.equal(false);
    expect(secondaryInfo.stateMapper(true, context)).to.equal(true);

    expect(secondaryInfo.actionTimeout).to.equal(ACTION_TIMEOUT);

    expect(secondaryInfo.sourceFilter([], context)).to.deep.equal([]);
  });

  it('custom secondary info type', () => {
    const rawConfig = {
      entity: 'fan.t',
      model: 'empty',
      secondary_info: {
        type: 'custom',
        action_timeout: 2333,
        style: (): StyleInfo => ({ padding: '4px' }),
      },
    };

    const config = new Config(rawConfig);

    assert.isDefined(config.secondaryInfo);
    const secondaryInfo = config.secondaryInfo;
    expect(secondaryInfo.type).to.equal('custom');

    const contextMock: ExecutionContext = mock<ExecutionContext>();
    const context: ExecutionContext = instance(contextMock);

    expect(secondaryInfo.actionTimeout).to.equal(2333);
    expect(secondaryInfo.style('any', context)).to.deep.equal({ padding: '4px' });
  });

  it('custom secondary info type', () => {
    const rawConfig = {
      entity: 'fan.t',
      model: 'empty',
      secondary_info: {
        type: 'custom',
        inheritance_button_id: 'unknown',
        action_timeout: 2333,
        style: (): StyleInfo => ({ padding: '4px' }),
      },
    };

    const config = new Config(rawConfig);

    assert.isDefined(config.secondaryInfo);
    const secondaryInfo = config.secondaryInfo;
    expect(secondaryInfo.type).to.equal('custom');

    const contextMock: ExecutionContext = mock<ExecutionContext>();
    const context: ExecutionContext = instance(contextMock);

    expect(secondaryInfo.actionTimeout).to.equal(2333);
    expect(secondaryInfo.style('any', context)).to.deep.equal({ padding: '4px' });
  });

  it('inheritance_button_id', () => {
    const rawConfig = {
      entity: 'fan.t',
      model: 'empty',
      buttons: {
        test: {
          type: 'dropdown',
          source: { id1: 'id1', id2: 'id2' },
          state: 'fan.t2',
        },
      },
      secondary_info: {
        type: 'custom',
        inheritance_button_id: 'test',
      },
    };

    const config = new Config(rawConfig);

    assert.isDefined(config.secondaryInfo);
    const secondaryInfo = config.secondaryInfo;
    expect(secondaryInfo.type).to.equal('custom');

    expect(secondaryInfo.state.entity).to.equal('fan.t2');
    expect(secondaryInfo.source).to.deep.equal([
      { id: 'id1', name: 'id1', order: 0 },
      { id: 'id2', name: 'id2', order: 1 },
    ]);
  });
});
