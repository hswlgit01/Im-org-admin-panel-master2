import component from './en-US/component';
import globalHeader from './en-US/globalHeader';
import menu from './en-US/menu';
import pages from './en-US/pages';
import pwa from './en-US/pwa';
import settingDrawer from './en-US/settingDrawer';
import chat from './en-US/chat';
import common from './en-US/common';
import message from './en-US/message';
import supplement from './en-US/supplement';
import compensation from './en-US/compensation';

export default {
  'navBar.lang': 'Languages',
  'layout.user.link.help': 'Help',
  'layout.user.link.privacy': 'Privacy',
  'layout.user.link.terms': 'Terms',

  'app.copyright.produced': '心享-Admin',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...pwa,
  ...component,
  ...pages,
  ...chat,
  ...common,
  ...message,
  ...supplement,
  ...compensation,
};
