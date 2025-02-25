import {PagesEnum} from "@/services/permissions/pages-enum";
import {useI18n} from "vue-i18n";

export class SidebarConfig{

  config = new Map<PagesEnum,SidebarElement>() ;
  i18n = useI18n();

  constructor() {
    this.config.set(PagesEnum.DASHBOARD, this.createDashboard());
    this.config.set(PagesEnum.STAKING, this.createStaking());
    this.config.set(PagesEnum.GOVERNANCE, this.createGovernance());
    //this.config.set(PagesEnum.AirDrop, this.createAirDrop());
  }

  getConfigForPage(page: PagesEnum): SidebarElement | undefined{
    return this.config.get(page);
  }

  private createDashboard(): SidebarElement{
    const retVal = new SidebarElement();
    retVal.id = 0;
    retVal.href = '/dashboard';
    retVal.title = "Dashboard";
    retVal.icon = new SidebarIcon('LayoutDashboard');
    return retVal;
  }

  private createStaking(): SidebarElement{
    const retVal = new SidebarElement();
    retVal.id = 1;
    retVal.href = '/staking';
    retVal.title = 'Staking';
    retVal.icon = new SidebarIcon('Wallet');
    return retVal;
  }

  private createGovernance(): SidebarElement{
    const retVal = new SidebarElement();
    retVal.id = 2;
    retVal.href = '/governance';
    retVal.title = 'Governance';
    retVal.icon = new SidebarIcon('Landmark');
    return retVal;
  }

  /*private createAirDrop(): SidebarElement{
    const retVal = new SidebarElement();
    retVal.id = 3;
    retVal.href = '/airdrop';
    retVal.title = 'Airdrop';
    retVal.icon = new SidebarIcon('Award');
    return retVal;
  }*/

}

export class SidebarElement {
  id = 1;
  href = "" ;
  title ="";
  icon = new SidebarIcon('');

}

export enum SideBarIconType {
  LUCIDE,
  GOV
}
export class SidebarIcon {
  element: string;
  type: SideBarIconType;
  constructor(element: string, type = SideBarIconType.LUCIDE) {
    this.element = element;
    this.type = type;
  }
}


