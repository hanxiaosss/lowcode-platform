import DescriptionTip from '@/components/descriptionTip'
import { strapiRequestInstance, useStrapiRequest } from '@/lib/request'
import { Button, message, Modal, Table, Tabs, Tag, Tooltip } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SelectPeopleDialog from '@/pages/platform/components/selectPeopleDialog'
import { useUserRole } from './hooks'
const commonColumns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    render: (_: any, record: any) => (
      <>
        <span className='mr-[6px] text-[14px]'>{record.username}</span>
        {record.isSuperAdmin && (
          <Tooltip placement='right' title='超级管理员权限仅可以在后台修改'>
            <Tag color='blue'>超级管理员</Tag>
          </Tooltip>
        )}
      </>
    )
  }
]

function getPlatformAdmins() {
  return strapiRequestInstance('/api/users/platformAdmin')
}

const PlatformAdminManage: React.FC<{ tabType: 'application' | 'platform' }> = ({ tabType }) => {
  const [admins, setAdmins] = useState<ApiUsersPlatformAdminResponse['data']>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [open, setOpen] = useState(false)

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys: selectedRowKeys,
      onChange: (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys)
      },
      columnWidth: 50,
      getCheckboxProps(record: any) {
        return {
          disabled: record.isSuperAdmin
        }
      }
    }),
    [selectedRowKeys]
  )

  const [addUsersRole, removeUsersRole] = useUserRole({
    addSuccessCb: () => {
      setOpen(false)
      getPlatformAdmins().then((res) => {
        setAdmins(res.data)
      })
    },
    removeSuccessCb: () => {
      getPlatformAdmins().then((res) => {
        setAdmins(res.data)
      })
    }
  })

  const columns = useMemo(() => {
    return [
      ...commonColumns,
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: any) => {
          // 当前行不是超级管理员，可以被移除平台管理员
          if (!record.isSuperAdmin) {
            return (
              <span
                className='cursor-pointer text-c_primary text-[14px]'
                onClick={() => removeUsersRole('ApplicationAdmin', [record.id])}
              >
                移除成员
              </span>
            )
          }
        }
      }
    ]
  }, [removeUsersRole])

  const {
    loading: usersOptionsLoading,
    data,
    runAsync: getUsersForAdmin
  } = useStrapiRequest('/api/users/forPlatformAdmin', undefined, { manual: true })

  const usersOptionsRes = useMemo(() => {
    return data?.data ?? []
  }, [data])

  const openAddPeopleDialog = useCallback(() => {
    getUsersForAdmin()
    setOpen(true)
  }, [])

  const onOk = useCallback(
    (userIds: React.Key[]) => {
      addUsersRole('PlatformAdmin', userIds)
    },
    [addUsersRole]
  )

  useEffect(() => {
    if (tabType === 'platform') {
      getPlatformAdmins().then((res) => {
        setAdmins(res.data)
      })
    }
  }, [tabType])

  useEffect(() => {
    setSelectedRowKeys([])
  }, [admins])

  return (
    <div className=''>
      <DescriptionTip
        description='平台管理员具有管理所有应用的权限。其中，后台赋予的超级管理员已自动同步为平台管理员，如需调整可至后台调整'
        className='mb-[16px]'
      />
      <div className='flex items-center mb-[16px]'>
        <Button type='primary' className='mr-[8px]' size='large' onClick={openAddPeopleDialog}>
          添加成员
        </Button>
        <Button size='large' onClick={() => removeUsersRole('ApplicationAdmin', selectedRowKeys)}>
          删除
        </Button>
      </div>
      <Table dataSource={admins} columns={columns} rowKey='id' pagination={false} rowSelection={rowSelection} />
      <SelectPeopleDialog
        open={open}
        setOpen={setOpen}
        onOk={onOk}
        userOptions={usersOptionsRes}
        optionsLoading={usersOptionsLoading}
      />

      <style jsx>{`
        div :global(.ant-table-thead .ant-table-cell) {
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}

export default React.memo(PlatformAdminManage)