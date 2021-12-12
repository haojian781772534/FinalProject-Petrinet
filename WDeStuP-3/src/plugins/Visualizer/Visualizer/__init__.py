"""
This is where the implementation of the plugin code goes.
The Visualizer-class is imported from both run_plugin.py and run_debug.py
"""
import sys
import logging
from webgme_bindings import PluginBase

# Setup a logger
logger = logging.getLogger('Visualizer')
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)  # By default it logs to stderr..
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)


class Visualizer(PluginBase):
    def main(self):
        core = self.core
        META = self.META
        root_node = self.root_node
        active_node = self.active_node
        nodes = core.load_sub_tree(active_node)
        path2node = {}
        raw_arcs = []
        template_parameters = {'name': core.get_attribute(active_node,'name'), 'Place':[], 'Transition':[], 'Arc1':[],'Arc2':[]}

        for node in nodes:
            path2node[core.get_path(node)] = node
            if core.is_type_of(node,META['Place']):
                names = core.get_valid_attribute_names(node)
                node_data = {}
                for name in names:
                    node_data[name] = core.get_attribute(node, name)
                node_data['path'] = core.get_path(node)
                template_parameters['Places'].append(node_data)
            elif core.is_type_of(node,META['Transition']):

                names = core.get_valid_attribute_names(node)
                node_data = {}
                for name in names:
                    node_data[name] = core.get_attribute(node, name)
                node_data['path'] = core.get_path(node)
                template_parameters['Transition'].append(node_data)
            elif core.is_type_of(node, META['Arc1']):
                #gather the source and destination of the pointer
                src_path = core.get_pointer_path(node, 'src')
                dst_path = core.get_pointer_path(node, 'dst')
                if src_path and dst_path:
                    template_parameters['Arc1'].append({'name':core.get_attribute(node,'name'),'src':src_path, 'dst': dst_path, 'path': core.get_path(node)})

            elif core.is_type_of(node, META['Arc2']):
                src_path = core.get_pointer_path(node, 'src')
                dst_path = core.get_pointer_path(node, 'dst')
                if src_path and dst_path:
                    template_parameters['Arc2'].append({'name':core.get_attribute(node,'name'),'src':src_path, 'dst': dst_path, 'path': core.get_path(node)})

        name = core.get_attribute(active_node, 'name')

        logger.info('ActiveNode at "{0}" has name {1}'.format(core.get_path(active_node), name))

        commit_info = self.util.save(root_node, self.commit_hash, 'master', 'Python plugin updated the model')
        logger.info('committed :{0}'.format(commit_info))

        def cInplaces(transition,arcs1):
            inplaces = []
            for arc in arcs1:
                if arc['dst'] == transition['path']:
                    inplaces.append(arc['src'])
            return inplaces

        def cOutplaces(transition,arcs2):
            outplaces = []
            for arc in arcs2:
                if arc['src'] == transition['path']:
                    outplaces.append(arc['dst'])
            return outplaces

        def isFreeChoicePN(transitions,arcs1):
            inplaces_list = []

            for i in range(len(transitions)):
                inplaces_list = inplaces_list + cInplaces(transitions[i],arcs1)
            if len(inplaces_list) == len(list(set(inplaces_list))):
                return 1
            else:
                return 0

        def isStateMachinePN(transitions,arcs1,arcs2):
            flag = 1
            for i in range(len(transitions)):
                if not ((len(cInplaces(transitions[i],arcs1)) == 1) and (len(cOutplaces(transitions[i],arcs2)) == 1)):
                    flag = 0
                    break
            return flag

        def isMarkedGraphPN(places,arcs1,arcs2):
            flag = 1
            for i in range(len(places)):
                if not ((len(cInplaces(places[i],arcs2)) == 1) and (len(cOutplaces(places[i],arcs1)) == 1)):
                    flag = 0
                    break
            return flag

        def isWorkflowNetPN(places,transitions,arcs1,arcs2):
            cnt = 0
            for i in range(len(places)):
                if len(cInplaces(places[i],arcs2)) == 0:
                    cnt = cnt + 1
                    src_index = i
                    if cnt > 1:
                        return 0
            if (cnt == 0) or (cnt > 1):
                return 0
            cnt = 0
            for i in range(len(places)):
                if len(cOutplaces(places[i],arcs1)) == 0:
                    cnt = cnt + 1
                    dst_index = i
                    if cnt > 1:
                        return 0
            if (cnt == 0) or (cnt > 1):
                return 0

            places_path = [place['path'] for place in places]
            trans_path = [trans['path'] for trans in transitions]
            flag_places = []
            flag_transitions = []
            q_places = [src_index]
            q_transitions = []
            while ((len(q_places) + len(q_transitions) > 0)):
                if (len(q_places) > 0):
                    current_place = q_places.pop(0)
                    flag_places = list(set(flag_places + [current_place]))
                    tmp_trans = cOutplaces(places[current_place],arcs1)
                    if (len(tmp_trans) > 0):
                        tmp_trans = [trans_path.index(tmp) for tmp in tmp_trans]
                        q_transitions = list((set(q_transitions + tmp_trans) - set(flag_transitions)))

                if (len(q_transitions) > 0):
                    current_transition = q_transitions.pop(0)
                    flag_transitions = list(set(flag_transitions + [current_transition]))
                    tmp_pls = cOutplaces(transitions[current_transition],arcs2)
                    if (len(tmp_pls) > 0):
                        tmp_pls = [places_path.index(tmp) for tmp in tmp_pls]
                        q_places = list((set(q_places + tmp_pls) - set(flag_places)))

            if (len(flag_places) == len(places)) and (len(flag_transitions) == len(transitions)):
                return 1
            else:
                return 0

        flags = [isFreeChoicePN(template_parameters['Transition'],template_parameters['Arc1']),\
                isStateMachinePN(template_parameters['Transition'],template_parameters['Arc1'],template_parameters['Arc2']),\
                isMarkedGraphPN(template_parameters['Place'],template_parameters['Arc1'],template_parameters['Arc2']),\
                isWorkflowNetPN(template_parameters['Place'],template_parameters['Transition'],template_parameters['Arc1'],template_parameters['Arc2'])]
        message_classifier = ""
        for i in range(len(flags)):
            if i < len(flags) - 1:
                message_classifier = message_classifier + str(flags[i]) + " "
            else:
                message_classifier = message_classifier + str(flags[i])

        self.create_message(active_node,str(len(template_parameters['Place'])) + " " +\
                                        str(len(template_parameters['Transition'])) + " " +\
                                        str(len(template_parameters['Arc1'])) + " " +\
                                        str(len(template_parameters['Arc2'])), severity='info')

        message_places = []
        for i in range(len(template_parameters['Place'])):
            message_places.append(template_parameters['Place'][i]['name']+" "+template_parameters['Place'][i]['path']+" "\
            +str(template_parameters['Place'][i]['marking']))

        for i in range(len(template_parameters['Place'])):
            self.create_message(active_node,message_places[i], severity='info')

        message_transitions = []
        for i in range(len(template_parameters['Transition'])):
            message_transitions.append(template_parameters['Transition'][i]['name']+" "+template_parameters['Transition'][i]['path'])

        for i in range(len(template_parameters['Transition'])):
            self.create_message(active_node,message_transitions[i], severity='info')

        message_arcs1 = []
        for i in range(len(template_parameters['Arc1'])):
            message_arcs1.append(template_parameters['Arc1'][i]['name'] + " " + template_parameters['Arc1'][i]['path'] + " "+template_parameters['Arc1'][i]['src']+" "+template_parameters['Arc1'][i]['dst'])

        for i in range(len(template_parameters['Arc1'])):
            self.create_message(active_node,message_arcs1[i], severity='info')

        message_arcs2 = []
        for i in range(len(template_parameters['Arc2'])):
            message_arcs2.append(template_parameters['Arc2'][i]['name'] + " " + template_parameters['Arc2'][i]['path'] + " "+template_parameters['Arc2'][i]['src']+" "+template_parameters['Arc2'][i]['dst'])

        for i in range(len(template_parameters['Arc2'])):
            self.create_message(active_node,message_arcs2[i], severity='info')
